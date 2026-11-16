'use client';

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CheckCircle2,
  Fingerprint,
  QrCode,
  RefreshCw,
  ScanLine,
  StopCircle,
  Upload,
  Usb,
} from 'lucide-react';
import { attendanceService, StudentAttendanceRecord } from '@/services/attendanceService';
import { showToast } from '@/components/ui/ToastProvider';

interface QrAndBiometricAttendancePanelProps {
  selectedDate: string;
  selectedGrade: string;
  selectedBranch: string;
  performedBy?: string;
  canTakeAttendance: boolean;
  onAttendanceUpdated?: () => void;
}

interface RecentScanEntry {
  id: string;
  studentName: string;
  roll: string;
  grade: string;
  time: string;
  method: 'qr' | 'biometric';
  mode: 'check-in' | 'check-out';
  deviceId: string;
}

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement | HTMLCanvasElement) => Promise<Array<{ rawValue?: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

export function QrAndBiometricAttendancePanel({
  selectedDate,
  selectedGrade,
  selectedBranch,
  performedBy,
  canTakeAttendance,
  onAttendanceUpdated,
}: QrAndBiometricAttendancePanelProps) {
  const [scanMode, setScanMode] = useState<'check-in' | 'check-out'>('check-in');
  const [deviceId, setDeviceId] = useState<string>('MAIN-GATE-01');
  const [wedgeInput, setWedgeInput] = useState<string>('');
  const [zkText, setZkText] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [isSyncingPush, setIsSyncingPush] = useState<boolean>(false);
  const [recentScans, setRecentScans] = useState<RecentScanEntry[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScannedRef = useRef<{ token: string; ts: number }>({ token: '', ts: 0 });
  const wedgeRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const pushRecentEntry = (
    st: StudentAttendanceRecord,
    method: 'qr' | 'biometric',
    mode: 'check-in' | 'check-out',
    usedDevice: string
  ) => {
    const time = (mode === 'check-out' ? st.checkOutTime : st.checkInTime) || '--:--';
    setRecentScans((prev) => [
      {
        id: `${st.id}-${Date.now()}`,
        studentName: st.name,
        roll: st.roll,
        grade: st.grade,
        time,
        method,
        mode,
        deviceId: usedDevice,
      },
      ...prev.slice(0, 11),
    ]);
  };

  const handleDecodedPayload = (rawToken: string, method: 'qr' | 'biometric' = 'qr') => {
    if (!canTakeAttendance) {
      showToast('অবৈধ অনুমতি: কেবল অনুমোদিত শিক্ষক বা অ্যাডমিন হাজিরা গ্রহণ করতে পারবেন।', 'error');
      return;
    }
    const clean = rawToken.trim();
    if (!clean) return;

    const nowMs = Date.now();
    if (lastScannedRef.current.token === clean && nowMs - lastScannedRef.current.ts < 1800) {
      return;
    }
    lastScannedRef.current = { token: clean, ts: nowMs };

    const res = attendanceService.recordQrCheckIn(clean, {
      date: selectedDate,
      fallbackGrade: selectedGrade,
      fallbackBranch: selectedBranch,
      mode: scanMode,
      verificationMethod: method,
      deviceId: deviceId.trim() || 'SCANNER-01',
      performedBy,
    });

    if (res.success && res.student) {
      showToast(res.message, 'success');
      pushRecentEntry(res.student, method, scanMode, deviceId.trim() || 'SCANNER-01');
      onAttendanceUpdated?.();
    } else {
      showToast(res.message, 'error');
    }
  };

  const startCamera = async () => {
    setCameraError('');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('এই ব্রাউজার বা ডিভাইসে ওয়েবক্যাম API পাওয়া যায়নি। USB স্ক্যানার বা ম্যানুয়াল ইনপুট ব্যবহার করুন।');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);

      const videoEl = videoRef.current;
      if (videoEl) {
        videoEl.srcObject = stream;
        await videoEl.play();
      }

      const detector =
        typeof window !== 'undefined' && window.BarcodeDetector
          ? new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39'] })
          : null;

      let scanningBusy = false;
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        const vid = videoRef.current;
        if (vid.readyState >= 2 && vid.videoWidth > 0 && !scanningBusy) {
          scanningBusy = true;
          try {
            let detectedValue = '';
            if (detector) {
              const codes = await detector.detect(vid);
              if (codes.length > 0 && codes[0].rawValue) {
                detectedValue = codes[0].rawValue;
              }
            }
            if (!detectedValue && canvasRef.current) {
              const canvas = canvasRef.current;
              canvas.width = vid.videoWidth;
              canvas.height = vid.videoHeight;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const decoded = jsQR(imgData.data, imgData.width, imgData.height, {
                  inversionAttempts: 'dontInvert',
                });
                if (decoded?.data) {
                  detectedValue = decoded.data;
                }
              }
            }
            if (detectedValue) {
              handleDecodedPayload(detectedValue, 'qr');
            }
          } catch {
            // Keep scanning smoothly across frames
          } finally {
            scanningBusy = false;
          }
        }
        rafRef.current = requestAnimationFrame(() => {
          void tick();
        });
      };

      rafRef.current = requestAnimationFrame(() => {
        void tick();
      });
    } catch {
      stopCamera();
      setCameraError('ক্যামেরা চালুর অনুমতি পাওয়া যায়নি বা কোনো ক্যামেরা সংযুক্ত নেই।');
    }
  };

  const handleWedgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedgeInput.trim()) return;
    handleDecodedPayload(wedgeInput, 'qr');
    setWedgeInput('');
    wedgeRef.current?.focus();
  };

  const handleZkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setZkText(text);
    showToast(`${file.name} লোড হয়েছে — এখন ইমপোর্ট বাটনে ক্লিক করুন।`, 'info');
    e.target.value = '';
  };

  const handleImportZkText = (rawSource?: string) => {
    if (!canTakeAttendance) {
      showToast('অবৈধ অনুমতি: কেবল অনুমোদিত শিক্ষক বা অ্যাডমিন বায়োমেট্রিক লগ ইমপোর্ট করতে পারবেন।', 'error');
      return;
    }
    const content = rawSource ?? zkText;
    const res = attendanceService.importZKTecoLogs(content, {
      defaultDate: selectedDate,
      deviceId: deviceId.trim() || 'ZKTECO-01',
      performedBy,
    });
    if (res.importedCount > 0) {
      showToast(res.message, 'success');
      onAttendanceUpdated?.();
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handleSyncServerPush = async () => {
    setIsSyncingPush(true);
    try {
      const response = await fetch('/api/biometric/zkteco-push?clear=1');
      if (!response.ok) {
        showToast('সার্ভার বায়োমেট্রিক পুশ এন্ডপয়েন্ট সাড়া দেয়নি।', 'error');
        return;
      }
      const data = (await response.json()) as {
        success?: boolean;
        punches?: Array<{ userId: string; timestamp: string; deviceId?: string; state?: string }>;
      };
      const punches = data.punches || [];
      if (punches.length === 0) {
        showToast('সার্ভার বাফারে কোনো নতুন বায়োমেট্রিক পাঞ্চ জমা নেই।', 'info');
        return;
      }
      const rawLines = punches
        .map((p) => `${p.userId}\t${p.timestamp}\t${p.state || '0'}\t${p.deviceId || 'ZKTECO-PUSH'}`)
        .join('\n');
      handleImportZkText(rawLines);
    } catch {
      showToast('সার্ভার বায়োমেট্রিক সিঙ্ক করা যায়নি।', 'error');
    } finally {
      setIsSyncingPush(false);
    }
  };

  return (
    <div className="space-y-5 print:hidden">
      {/* Mode & Device Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
            <QrCode size={22} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              স্মার্ট QR আইডি স্ক্যানার ও বায়োমেট্রিক (ZKTeco) হাজিরা
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              শিক্ষার্থীর CR80 আইডি কার্ডের QR কোড স্ক্যান করুন অথবা ZKTeco ডিভাইস লগ সরাসরি ইমপোর্ট করুন (তারিখ: {selectedDate})।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setScanMode('check-in')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                scanMode === 'check-in'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              চেক-ইন (প্রবেশ)
            </button>
            <button
              type="button"
              onClick={() => setScanMode('check-out')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                scanMode === 'check-out'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              চেক-আউট (প্রস্থান)
            </button>
          </div>

          <input
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="গেট / ডিভাইস আইডি"
            aria-label="গেট বা ডিভাইস আইডি"
            className="w-36 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs font-bold outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Webcam + USB Wedge QR Scanner */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <Camera size={16} className="text-indigo-600 dark:text-indigo-400" />
              ১. ওয়েবক্যাম ও USB QR স্ক্যানার
            </h4>
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
              >
                <ScanLine size={14} /> ক্যামেরা চালু করুন
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
              >
                <StopCircle size={14} /> স্ক্যানার বন্ধ করুন
              </button>
            )}
          </div>

          {cameraError && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs font-bold">
              {cameraError}
            </div>
          )}

          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-200 dark:border-slate-800">
            <video ref={videoRef} className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`} playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!cameraActive && (
              <div className="text-center p-6 space-y-2">
                <QrCode size={42} className="mx-auto text-slate-500" />
                <p className="text-xs font-bold text-slate-400">
                  আইডি কার্ডের QR কোড স্ক্যান করতে &ldquo;ক্যামেরা চালু করুন&rdquo; চাপুন অথবা নিচের USB বক্স ব্যবহার করুন।
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleWedgeSubmit} className="space-y-2 pt-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Usb size={14} className="text-emerald-600 dark:text-emerald-400" />
              USB বারকোড/QR রিডার বা রোল নম্বর (স্ক্যান করে Enter দিন)
            </label>
            <div className="flex gap-2">
              <input
                ref={wedgeRef}
                type="text"
                value={wedgeInput}
                onChange={(e) => setWedgeInput(e.target.value)}
                placeholder="যেমন: SMS-STU|stu-101|01|6th বা 101"
                className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition cursor-pointer shrink-0"
              >
                মার্ক করুন
              </button>
            </div>
          </form>
        </div>

        {/* Right: Biometric ZKTeco Import & Push Sync */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <Fingerprint size={16} className="text-teal-600 dark:text-teal-400" />
              ২. বায়োমেট্রিক ডিভাইস (ZKTeco / ATTLog / CSV)
            </h4>
            <button
              type="button"
              onClick={handleSyncServerPush}
              disabled={isSyncingPush}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw size={13} className={isSyncingPush ? 'animate-spin' : ''} />
              সার্ভার পুশ সিঙ্ক
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              ZKTeco থেকে পাওয়া <code className="font-mono text-indigo-600 dark:text-indigo-400">.dat / .txt / .csv</code> ফাইল আপলোড করুন:
            </span>
            <label className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5">
              <Upload size={13} />
              ফাইল নির্বাচন
              <input type="file" accept=".dat,.txt,.csv,.log" onChange={handleZkFileChange} className="hidden" />
            </label>
          </div>

          <textarea
            rows={6}
            value={zkText}
            onChange={(e) => setZkText(e.target.value)}
            placeholder={`উদাহরণ ফরম্যাট:\n01\t2026-11-14 08:52:10\t0\tZK-01\nstu-102,2026-11-14 15:40:00,out,ZK-01`}
            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-[11px] outline-none resize-y"
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-slate-400">
              পুশ ওয়েবহুক: <code className="font-mono">/api/biometric/zkteco-push</code>
            </span>
            <button
              type="button"
              onClick={() => handleImportZkText()}
              className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
            >
              বায়োমেট্রিক লগ ইমপোর্ট করুন
            </button>
          </div>
        </div>
      </div>

      {/* Live Scan Log */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
          সাম্প্রতিক লাইভ স্ক্যান ও ভেরিফিকেশন লগ
        </h4>
        {recentScans.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold py-3">
            এখনো এই সেশনে কোনো QR বা USB স্ক্যান সম্পন্ন হয়নি।
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentScans.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <strong className="font-black text-slate-900 dark:text-white block">{entry.studentName}</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    রোল {entry.roll} ({entry.grade}) • {entry.deviceId}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-black text-[10px]">
                    {entry.method === 'biometric' ? 'BIO' : 'QR'} {entry.time}
                  </span>
                  <span className="block text-[9px] font-bold text-slate-400 mt-0.5">
                    {entry.mode === 'check-out' ? 'চেক-আউট' : 'চেক-ইন'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
