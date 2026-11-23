'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Upload,
  FileText,
  Flashlight,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Trash2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  OmrExamSession,
  OmrScanRecord,
  omrService,
} from '@/services/omrService';
import {
  LiveFrameQualityReport,
  OmrDecodeResult,
  decodeOmrImageBuffer,
  evaluateLiveFrameQuality,
  mergeDualFrameDecodes,
  warpedBufferToDataUrl,
} from '@/lib/omr/omrVisionEngine';
import {
  loadImageFileToRgbaBuffer,
  loadPdfPagesToRgbaBuffers,
} from '@/lib/omr/omrPdfBatchLoader';
import { showToast } from '@/components/ui/ToastProvider';

interface OmrScannerTabProps {
  session: OmrExamSession;
  scans: OmrScanRecord[];
  scannerUserName: string;
  onScansChanged: () => void;
  onInspectScan: (scan: OmrScanRecord) => void;
  onJumpToAnswerKey: () => void;
  onSwitchToSession?: (targetSession: OmrExamSession) => void;
}

interface DuplicatePromptState {
  existing: OmrScanRecord;
  proposed: OmrScanRecord;
  decode: OmrDecodeResult;
  warpedThumbnail?: string;
  sourceType: 'camera' | 'image' | 'pdf';
}

function playFeedbackBeep(kind: 'success' | 'warn' | 'error') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = kind === 'success' ? 880 : kind === 'warn' ? 560 : 320;
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (kind === 'success' ? 0.14 : 0.22));
    osc.start();
    osc.stop(ctx.currentTime + (kind === 'success' ? 0.15 : 0.23));
  } catch {
    // ignore audio block
  }
}

export default function OmrScannerTab({
  session,
  scans,
  scannerUserName,
  onScansChanged,
  onInspectScan,
  onJumpToAnswerKey,
  onSwitchToSession,
}: OmrScannerTabProps) {
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const [autoSyncIdentity, setAutoSyncIdentity] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [quality, setQuality] = useState<LiveFrameQualityReport | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastAutoRouted, setLastAutoRouted] = useState<{
    session: OmrExamSession;
    summaryBn: string;
    studentRoll: string;
    studentName: string;
  } | null>(null);

  const [batchProgress, setBatchProgress] = useState<{
    active: boolean;
    current: number;
    total: number;
    label: string;
  }>({ active: false, current: 0, total: 0, label: '' });

  const [duplicatePrompt, setDuplicatePrompt] = useState<DuplicatePromptState | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const prevSmallGrayRef = useRef<Uint8Array | null>(null);
  const steadySinceRef = useRef<number>(0);
  const lastCaptureAtRef = useRef<number>(0);
  const capturingLockRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasAnswerKey = useMemo(
    () =>
      Object.values(session.answerKeys).some(
        (arr) => Array.isArray(arr) && arr.some((v) => v !== null),
      ),
    [session.answerKeys],
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setTorchSupported(false);
    setQuality(null);
    prevSmallGrayRef.current = null;
    steadySinceRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('এই ব্রাউজারে ক্যামেরা অ্যাক্সেস সাপোর্ট নেই। অনুগ্রহ করে ছবি/PDF আপলোড ব্যবহার করুন।');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check torch / flash capability
      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
      setTorchSupported(Boolean(caps?.torch));

      // Request screen wake lock so phone doesn't dim mid-exam scanning
      const navWithWake = navigator as Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
      };
      if (navWithWake.wakeLock?.request) {
        navWithWake.wakeLock
          .request('screen')
          .then((lock) => {
            wakeLockRef.current = lock;
          })
          .catch(() => {});
      }

      setCameraActive(true);
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? `ক্যামেরা চালু করা যায়নি: ${err.message}`
          : 'ক্যামেরা পারমিশন পাওয়া যায়নি। ব্রাউজার সেটিংস থেকে ক্যামেরা অনুমতি দিন।',
      );
    }
  }, []);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      showToast('এই ডিভাইসে ফ্ল্যাশ/টর্চ চালু করা যায়নি।', 'error');
    }
  };

  const grabVideoFrameBuffer = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth < 64 || video.videoHeight < 64) return null;
    if (!workCanvasRef.current) {
      workCanvasRef.current = document.createElement('canvas');
    }
    const canvas = workCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return {
      data: imgData.data,
      width: imgData.width,
      height: imgData.height,
    };
  }, []);

  const handlePersistDecodedResult = useCallback(
    (
      decode: OmrDecodeResult,
      sourceType: 'camera' | 'image' | 'pdf',
      overwriteDuplicate: boolean = false,
    ) => {
      if (!decode.success) {
        if (soundEnabled) playFeedbackBeep('error');
        showToast(decode.error || 'OMR শিটটি সঠিকভাবে পড়া যায়নি।', 'error');
        return false;
      }

      const thumb = decode.warpedBuffer
        ? warpedBufferToDataUrl(decode.warpedBuffer, 640, 0.78)
        : undefined;

      const outcome = omrService.recordDecodedScan({
        session,
        decode,
        sourceType,
        scannedBy: scannerUserName,
        warpedThumbnail: thumb,
        overwriteDuplicate,
        autoSyncIdentity,
      });

      if (outcome.status === 'duplicate_conflict' && outcome.existingRecord) {
        if (soundEnabled) playFeedbackBeep('warn');
        setDuplicatePrompt({
          existing: outcome.existingRecord,
          proposed: outcome.record,
          decode,
          warpedThumbnail: thumb,
          sourceType,
        });
        return false;
      }

      onScansChanged();
      if (soundEnabled) {
        playFeedbackBeep(outcome.record.needsReview ? 'warn' : 'success');
      }

      if (outcome.autoRouted && outcome.routingSummaryBn) {
        setLastAutoRouted({
          session: outcome.targetSession,
          summaryBn: outcome.routingSummaryBn,
          studentRoll: outcome.record.studentRoll,
          studentName: outcome.record.studentName,
        });
        showToast(
          `অটো-সিংক: ${outcome.routingSummaryBn} · রোল ${outcome.record.studentRoll} (${outcome.record.studentName}) — ${outcome.record.obtainedMarks}/${outcome.record.totalMarks}`,
          'success',
        );
      } else if (outcome.record.matchStatus === 'matched') {
        showToast(
          `রোল ${outcome.record.studentRoll} (${outcome.record.studentName}) — ${outcome.record.obtainedMarks}/${outcome.record.totalMarks} সংরক্ষিত${outcome.record.needsReview ? ' (যাচাই করুন)' : ''}`,
          outcome.record.needsReview ? 'info' : 'success',
        );
      } else {
        showToast(
          `অজানা রোল (${outcome.record.decodedRollRaw}) স্ক্যান হয়েছে — রোল যাচাই করে শিক্ষার্থী লিঙ্ক করুন।`,
          'info',
        );
      }
      return true;
    },
    [session, scannerUserName, onScansChanged, soundEnabled, autoSyncIdentity],
  );

  // Dual-frame capture from live camera
  const captureFromCamera = useCallback(async () => {
    if (capturingLockRef.current) return;
    capturingLockRef.current = true;
    setIsCapturing(true);

    try {
      const cfg = {
        templateId: session.templateId,
        questionCount: session.questionCount,
        paperFormat: session.paperFormat,
        rollDigits: session.rollDigits,
        optionStyle: session.optionStyle,
        setCount: session.setCount,
      };

      const frame1Buf = grabVideoFrameBuffer();
      if (!frame1Buf) {
        showToast('ক্যামেরা ফ্রেম প্রস্তুত নয়।', 'error');
        return;
      }
      const decode1 = decodeOmrImageBuffer(frame1Buf, cfg);

      // Short 130ms pause for second independent frame -> Dual-Frame Consensus
      await new Promise((res) => setTimeout(res, 130));
      const frame2Buf = grabVideoFrameBuffer();
      const decode2 = frame2Buf ? decodeOmrImageBuffer(frame2Buf, cfg) : decode1;

      const merged =
        decode1.success && decode2.success
          ? mergeDualFrameDecodes(decode1, decode2)
          : decode2.success
            ? decode2
            : decode1;

      lastCaptureAtRef.current = Date.now();
      handlePersistDecodedResult(merged, 'camera', false);
    } finally {
      capturingLockRef.current = false;
      setIsCapturing(false);
      steadySinceRef.current = 0;
    }
  }, [session, grabVideoFrameBuffer, handlePersistDecodedResult]);

  // Lightweight live quality-gate polling loop (~160ms)
  useEffect(() => {
    if (!cameraActive || scanMode !== 'camera') return;

    const timer = window.setInterval(() => {
      if (capturingLockRef.current || duplicatePrompt) return;
      const buf = grabVideoFrameBuffer();
      if (!buf) return;

      const { report, smallGray } = evaluateLiveFrameQuality(buf, prevSmallGrayRef.current);
      prevSmallGrayRef.current = smallGray;
      setQuality(report);

      const now = Date.now();
      const cooldownOk = now - lastCaptureAtRef.current > 2400;

      if (autoCapture && report.readyToCapture && cooldownOk) {
        if (steadySinceRef.current === 0) {
          steadySinceRef.current = now;
        } else if (now - steadySinceRef.current >= 320) {
          void captureFromCamera();
        }
      } else {
        steadySinceRef.current = 0;
      }
    }, 170);

    return () => window.clearInterval(timer);
  }, [cameraActive, scanMode, autoCapture, duplicatePrompt, grabVideoFrameBuffer, captureFromCamera]);

  // Single/Multi Photo & Multi-Page PDF Batch Upload
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const cfg = {
      templateId: session.templateId,
      questionCount: session.questionCount,
      paperFormat: session.paperFormat,
      rollDigits: session.rollDigits,
      optionStyle: session.optionStyle,
      setCount: session.setCount,
    };

    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;

    setBatchProgress({ active: true, current: 0, total: files.length, label: 'ফাইল প্রস্তুত হচ্ছে...' });

    try {
      for (const file of files) {
        const isPdf =
          file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
          const pages = await loadPdfPagesToRgbaBuffers(file, (pg, idx, total) => {
            setBatchProgress({
              active: true,
              current: idx,
              total,
              label: `PDF স্ক্যান: ${pg.label} (${idx}/${total})`,
            });
          });

          for (let i = 0; i < pages.length; i++) {
            const pg = pages[i];
            setBatchProgress({
              active: true,
              current: i + 1,
              total: pages.length,
              label: `ডিকোড হচ্ছে: ${pg.label}`,
            });
            const decoded = decodeOmrImageBuffer(pg.buffer, cfg);
            processedCount++;
            if (decoded.success) {
              const thumb = decoded.warpedBuffer
                ? warpedBufferToDataUrl(decoded.warpedBuffer, 640, 0.78)
                : undefined;
              // In multi-page batch PDF mode, auto-save (or overwrite same roll cleanly)
              const outcome = omrService.recordDecodedScan({
                session,
                decode: decoded,
                sourceType: 'pdf',
                scannedBy: scannerUserName,
                warpedThumbnail: thumb,
                overwriteDuplicate: pages.length > 1,
                autoSyncIdentity,
              });
              if (outcome.status === 'duplicate_conflict' && outcome.existingRecord) {
                setDuplicatePrompt({
                  existing: outcome.existingRecord,
                  proposed: outcome.record,
                  decode: decoded,
                  warpedThumbnail: thumb,
                  sourceType: 'pdf',
                });
              } else {
                successCount++;
              }
            } else {
              failCount++;
            }
          }
        } else {
          setBatchProgress({
            active: true,
            current: processedCount + 1,
            total: files.length,
            label: `ছবি স্ক্যান: ${file.name}`,
          });
          const page = await loadImageFileToRgbaBuffer(file);
          const decoded = decodeOmrImageBuffer(page.buffer, cfg);
          processedCount++;
          if (files.length === 1) {
            if (handlePersistDecodedResult(decoded, 'image', false)) {
              successCount++;
            } else if (!decoded.success) {
              failCount++;
            }
          } else if (decoded.success) {
            const thumb = decoded.warpedBuffer
              ? warpedBufferToDataUrl(decoded.warpedBuffer, 640, 0.78)
              : undefined;
            omrService.recordDecodedScan({
              session,
              decode: decoded,
              sourceType: 'image',
              scannedBy: scannerUserName,
              warpedThumbnail: thumb,
              overwriteDuplicate: true,
              autoSyncIdentity,
            });
            successCount++;
          } else {
            failCount++;
          }
        }
      }

      onScansChanged();
      if (processedCount > 1) {
        if (soundEnabled) playFeedbackBeep(failCount > 0 ? 'warn' : 'success');
        showToast(
          `ব্যাচ স্ক্যান সম্পন্ন: ${successCount}টি সফল${failCount > 0 ? `, ${failCount}টি পড়া যায়নি` : ''}।`,
          failCount > 0 ? 'info' : 'success',
        );
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ব্যাচ স্ক্যানে সমস্যা হয়েছে।', 'error');
    } finally {
      setBatchProgress({ active: false, current: 0, total: 0, label: '' });
    }
  };

  const handleResolveDuplicate = (overwrite: boolean) => {
    if (!duplicatePrompt) return;
    if (overwrite) {
      omrService.recordDecodedScan({
        session,
        decode: duplicatePrompt.decode,
        sourceType: duplicatePrompt.sourceType,
        scannedBy: scannerUserName,
        warpedThumbnail: duplicatePrompt.warpedThumbnail,
        overwriteDuplicate: true,
      });
      onScansChanged();
      showToast(
        `রোল ${duplicatePrompt.proposed.studentRoll} (${duplicatePrompt.proposed.studentName}) নতুন স্ক্যান দিয়ে আপডেট হয়েছে।`,
        'success',
      );
    } else {
      showToast('ডুপ্লিকেট স্ক্যান বাতিল করা হয়েছে — পূর্বের রেকর্ড অক্ষত আছে।', 'info');
    }
    setDuplicatePrompt(null);
  };

  return (
    <div className="space-y-4">
      {/* Answer Key Warning Banner if not set yet */}
      {!hasAnswerKey && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            এই বিষয়ের উত্তরপত্র (Answer Key) এখনো সেট করা হয়নি। উত্তরপত্র ছাড়া স্ক্যান করলে শুধু উত্তর জমা থাকবে — Key দিলেই নম্বর স্বয়ংক্রিয়ভাবে হিসাব হবে।
          </div>
          <button
            type="button"
            onClick={onJumpToAnswerKey}
            className="h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors"
          >
            উত্তরপত্র সেট করুন →
          </button>
        </div>
      )}

      {/* Auto-Routed Cross-Session Notification Banner */}
      {lastAutoRouted && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-200">
            <Sparkles className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
            <span>
              অটো-সিংক (বিষয় কোড + বিভাগ): <strong>{lastAutoRouted.summaryBn}</strong> — রোল {lastAutoRouted.studentRoll} ({lastAutoRouted.studentName}) সঠিক সেশনে জমা হয়েছে।
            </span>
          </div>
          {onSwitchToSession && (
            <button
              type="button"
              onClick={() => {
                onSwitchToSession(lastAutoRouted.session);
                setLastAutoRouted(null);
              }}
              className="h-7 px-3 rounded-lg bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-[11px] font-bold shrink-0"
            >
              সেই সেশনে যান →
            </button>
          )}
        </div>
      )}

      {/* Duplicate Roll Conflict Guard */}
      {duplicatePrompt && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 dark:border-amber-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-900 dark:text-white">
                ডুপ্লিকেট রোল শনাক্ত: রোল {duplicatePrompt.existing.studentRoll} ({duplicatePrompt.existing.studentName})
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                পূর্বের নম্বর: <strong>{duplicatePrompt.existing.obtainedMarks}/{duplicatePrompt.existing.totalMarks}</strong> ·
                নতুন স্ক্যান নম্বর: <strong>{duplicatePrompt.proposed.obtainedMarks}/{duplicatePrompt.proposed.totalMarks}</strong>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleResolveDuplicate(false)}
              className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              বাতিল করুন
            </button>
            <button
              type="button"
              onClick={() => handleResolveDuplicate(true)}
              className="h-8 px-3.5 rounded-lg bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-bold"
            >
              নতুনটি দিয়ে আপডেট করুন
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Live Camera / Photo & PDF Scanner Workspace */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs flex flex-col">
          {/* Scanner Sub-Mode Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="inline-flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setScanMode('camera')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                  scanMode === 'camera'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5D3B] dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> লাইভ ক্যামেরা
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setScanMode('upload');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                  scanMode === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5D3B] dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> ছবি / PDF ব্যাচ
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <label
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                title="শিটের ৩-ডিজিট বিষয় কোড, শ্রেণি ও বিভাগ পড়ে স্বয়ংক্রিয়ভাবে সঠিক সেশনে সেভ করবে"
              >
                <input
                  type="checkbox"
                  checked={autoSyncIdentity}
                  onChange={(e) => setAutoSyncIdentity(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5D3B] focus:ring-[#0B5D3B]"
                />
                অটো-সিংক
              </label>
              {scanMode === 'camera' && (
                <>
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={autoCapture}
                      onChange={(e) => setAutoCapture(e.target.checked)}
                      className="rounded border-slate-300 text-[#0B5D3B] focus:ring-[#0B5D3B]"
                    />
                    অটো-ক্যাপচার
                  </label>
                  {torchSupported && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        torchOn
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title="ফ্ল্যাশ/টর্চ"
                    >
                      <Flashlight className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={soundEnabled ? 'সাউন্ড চালু' : 'সাউন্ড বন্ধ'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Scanner Stage */}
          {scanMode === 'camera' ? (
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="relative w-full aspect-[3/4] max-h-[500px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />

                {!cameraActive && (
                  <div className="p-6 text-center space-y-3 max-w-sm">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">
                        মোবাইল / ওয়েবক্যাম OMR স্ক্যানার
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        শিটের ৪ কোণার কালো স্কয়ার ফ্রেমের ভেতর ধরলে ডুয়াল-ফ্রেম যাচাইয়ের মাধ্যমে স্বয়ংক্রিয়ভাবে স্ক্যান ও শিক্ষার্থী ম্যাচ হয়ে যাবে।
                      </p>
                    </div>
                    {cameraError && (
                      <p className="text-xs text-rose-400 font-medium bg-rose-950/50 border border-rose-800/60 rounded-xl px-3 py-2">
                        {cameraError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={startCamera}
                      className="h-10 px-5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Camera className="w-4 h-4" /> ক্যামেরা চালু করুন
                    </button>
                  </div>
                )}

                {/* Clean 4-Corner Fiducial Alignment Overlay (zero distracting lasers) */}
                {cameraActive && (
                  <>
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      {/* Corner bracket guides */}
                      <path
                        d="M 8 15 L 8 8 L 15 8 M 85 8 L 92 8 L 92 15 M 92 85 L 92 92 L 85 92 M 15 92 L 8 92 L 8 85"
                        fill="none"
                        stroke={quality?.hasFourCorners ? '#10b981' : 'rgba(255,255,255,0.75)'}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                      {/* Live detected fiducial quad */}
                      {quality?.cornersNormalized && (
                        <polygon
                          points={`${quality.cornersNormalized.tl.x * 100},${quality.cornersNormalized.tl.y * 100} ${quality.cornersNormalized.tr.x * 100},${quality.cornersNormalized.tr.y * 100} ${quality.cornersNormalized.br.x * 100},${quality.cornersNormalized.br.y * 100} ${quality.cornersNormalized.bl.x * 100},${quality.cornersNormalized.bl.y * 100}`}
                          fill="rgba(16, 185, 129, 0.08)"
                          stroke="#10b981"
                          strokeWidth="0.7"
                        />
                      )}
                    </svg>

                    {/* Live Quality Status Pill */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md ${
                          quality?.readyToCapture
                            ? 'bg-emerald-600/90 text-white'
                            : 'bg-slate-900/75 text-slate-100'
                        }`}
                      >
                        {isCapturing
                          ? 'ডুয়াল-ফ্রেম যাচাই হচ্ছে...'
                          : quality?.hintBn || 'ক্যামেরা প্রস্তুত হচ্ছে...'}
                      </span>

                      {quality && (
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full backdrop-blur-md ${
                              quality.hasFourCorners
                                ? 'bg-emerald-600/85 text-white'
                                : 'bg-slate-900/70 text-slate-300'
                            }`}
                          >
                            ৪-কর্নার
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full backdrop-blur-md ${
                              quality.isSteady
                                ? 'bg-emerald-600/85 text-white'
                                : 'bg-slate-900/70 text-slate-300'
                            }`}
                          >
                            স্থির
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full backdrop-blur-md ${
                              quality.isSharp
                                ? 'bg-emerald-600/85 text-white'
                                : 'bg-slate-900/70 text-slate-300'
                            }`}
                          >
                            স্পষ্ট
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Camera Action Bar */}
              {cameraActive && (
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                  >
                    <CameraOff className="w-4 h-4" /> ক্যামেরা বন্ধ
                  </button>

                  <button
                    type="button"
                    disabled={isCapturing}
                    onClick={() => void captureFromCamera()}
                    className="flex-1 h-10 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    {isCapturing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    এখনই স্ক্যান করুন (ম্যানুয়াল)
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Photo & Multi-Page PDF Upload Workspace */
            <div className="p-6 flex-1 flex flex-col items-center justify-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.pdf"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />

              <div
                onClick={() => !batchProgress.active && fileInputRef.current?.click()}
                className="w-full max-w-md rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0B5D3B] dark:hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-950/40 p-8 text-center space-y-3 cursor-pointer transition-colors"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center">
                  {batchProgress.active ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>

                {batchProgress.active ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {batchProgress.label}
                    </p>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B5D3B] transition-all"
                        style={{
                          width: `${batchProgress.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : 20}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        ছবি (JPG/PNG) বা মাল্টি-পেজ PDF আপলোড করুন
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ফোন ক্যামেরায় তোলা ছবি, স্ক্যানারের ব্যাচ PDF (১ ফাইলে ৫০+ শিট) — সবই সরাসরি ব্রাউজারে ফ্রি স্ক্যান হবে।
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <FileText className="w-3 h-3 text-rose-500" /> Multi-Page PDF
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <Sparkles className="w-3 h-3 text-emerald-600" /> অটো রোল ম্যাচিং
                      </span>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                disabled={batchProgress.active}
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" /> ফাইল নির্বাচন করুন (ছবি / PDF)
              </button>
            </div>
          )}
        </div>

        {/* Right: Recent Scanned Sheets Feed for Active Class & Subject */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                স্ক্যানকৃত শিটসমূহ ({scans.length})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {session.subjectName} · শ্রেণিভিত্তিক তাৎক্ষণিক রেকর্ড
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <RefreshCw className="w-3 h-3" /> অটো-সেভড
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[540px] divide-y divide-slate-100 dark:divide-slate-800/80">
            {scans.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  এখনো এই শ্রেণি ও বিষয়ের কোনো শিট স্ক্যান হয়নি।
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  বাম পাশ থেকে ক্যামেরা চালু করুন অথবা স্ক্যান করা ছবি/PDF আপলোড করুন।
                </p>
              </div>
            ) : (
              scans.map((sc) => (
                <div
                  key={sc.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center min-w-[34px] h-6 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        {sc.studentRoll}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {sc.studentName}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                      {sc.matchStatus === 'matched' ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> নিশ্চিত
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400 font-semibold">
                          <AlertTriangle className="w-3 h-3" /> অজানা রোল
                        </span>
                      )}
                      {sc.needsReview && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                          যাচাই প্রয়োজন
                        </span>
                      )}
                      {sc.decodedSubjectCodeRaw && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                          কোড {sc.decodedSubjectCodeRaw}
                        </span>
                      )}
                      {session.setCount === 4 && (
                        <span className="text-slate-500 dark:text-slate-400">
                          · সেট {sc.setCode}
                        </span>
                      )}
                      <span className="text-slate-500 dark:text-slate-400">
                        · সঠিক {sc.correctCount}, ভুল {sc.wrongCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {sc.obtainedMarks}
                        <span className="text-[11px] font-medium text-slate-400">
                          /{sc.totalMarks}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          sc.isPassedMcq
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {sc.percentage}%
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onInspectScan(sc)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#0B5D3B] hover:border-[#0B5D3B] transition-colors"
                      title="যাচাই ও সংশোধন"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        omrService.deleteScan(sc.id);
                        onScansChanged();
                        showToast('স্ক্যান রেকর্ড মুছে ফেলা হয়েছে।', 'info');
                      }}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
