'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Sliders,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Eye,
  Info,
  Save,
  X,
  Type
} from 'lucide-react';
import { SchoolSettings, settingsService, DEFAULT_PAD_MARGINS, PadMargins } from '@/services/settingsService';
import { processPadUpload, ProcessedPadResult } from '@/lib/padPdfRenderer';
import SchoolPadWrapper from './SchoolPadWrapper';

interface PadSettingsPanelProps {
  initialSettings?: SchoolSettings;
  onSaved?: (updated: SchoolSettings) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export default function PadSettingsPanel({
  initialSettings,
  onSaved,
  onClose,
  isModal = false,
}: PadSettingsPanelProps) {
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    return initialSettings || settingsService.getSettings();
  });

  const [activeTab, setActiveTab] = useState<'upload' | 'margins'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    } else {
      setSettings(settingsService.getSettings());
    }
  }, [initialSettings]);

  // Handle File Upload (PDF or Image)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setProcessStatus(isPdf ? 'পিডিএফ বিশ্লেষণ ও হাই-রেজ্যুলেশন ইমেজে কনভার্ট করা হচ্ছে...' : 'ছবি প্রসেস করা হচ্ছে...');

    try {
      const result: ProcessedPadResult = await processPadUpload(file);
      if (result.error || !result.dataUrl) {
        setAlertMsg({ type: 'error', text: result.error || 'ফাইলটি প্রসেস করতে ব্যর্থ হয়েছে।' });
        setIsProcessing(false);
        return;
      }

      // Default smart margins for uploaded pads
      const currentTop = settings.padMargins?.top || 2.0;
      const suggestedTop = currentTop < 1.2 ? 2.0 : currentTop;
      const currentBottom = settings.padMargins?.bottom || 1.0;
      const suggestedBottom = currentBottom < 0.6 ? 1.0 : currentBottom;

      const updatedSettings: SchoolSettings = {
        ...settings,
        uploadedPadTemplateUrl: result.dataUrl,
        uploadedPadType: result.padType,
        uploadedPadFileName: result.fileName,
        uploadedPadFileSize: result.fileSize,
        activePadMode: 'uploaded',
        padMargins: {
          ...DEFAULT_PAD_MARGINS,
          ...(settings.padMargins || {}),
          top: suggestedTop,
          bottom: suggestedBottom,
        },
      };

      setSettings(updatedSettings);
      settingsService.updateSettings(updatedSettings);

      setAlertMsg({
        type: 'success',
        text: `✓ ${result.fileName} (${result.padType === 'pdf' ? 'PDF ফাইল' : 'ইমেজ'}) সফলভাবে আপলোড ও কনভার্ট করা হয়েছে!`,
      });
      if (onSaved) onSaved(updatedSettings);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'আপলোড প্রক্রিয়ায় সমস্যা হয়েছে।' });
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
      if (e.target) e.target.value = '';
    }
  };

  // Remove uploaded pad
  const handleRemovePad = () => {
    if (!confirm('আপনি কি আপলোডকৃত প্যাডটি মুছে ফেলতে চান?')) return;
    const updatedSettings: SchoolSettings = {
      ...settings,
      uploadedPadTemplateUrl: '',
      uploadedPadFileName: '',
      uploadedPadFileSize: 0,
      activePadMode: 'preprinted',
    };
    setSettings(updatedSettings);
    settingsService.updateSettings(updatedSettings);
    setAlertMsg({ type: 'success', text: 'আপলোডকৃত প্যাড মুছে ফেলা হয়েছে।' });
    if (onSaved) onSaved(updatedSettings);
  };

  // Change active pad mode
  const handleModeSelect = (mode: 'uploaded' | 'preprinted') => {
    const updatedSettings: SchoolSettings = {
      ...settings,
      activePadMode: mode,
    };
    setSettings(updatedSettings);
    settingsService.updateSettings(updatedSettings);
    if (onSaved) onSaved(updatedSettings);
  };

  // Adjust margin value
  const updateMargin = (key: keyof PadMargins, value: number) => {
    const clamped = Math.max(0.2, Math.min(5.0, parseFloat(value.toFixed(2))));
    const updatedMargins: PadMargins = {
      ...DEFAULT_PAD_MARGINS,
      ...(settings.padMargins || {}),
      [key]: clamped,
    };
    const updatedSettings: SchoolSettings = {
      ...settings,
      padMargins: updatedMargins,
    };
    setSettings(updatedSettings);
  };

  const stepMargin = (key: keyof PadMargins, delta: number) => {
    const current = settings.padMargins?.[key] ?? DEFAULT_PAD_MARGINS[key];
    updateMargin(key, current + delta);
  };

  // Quick Preset Handlers
  const applyPreset = (preset: 'standard' | 'compact' | 'large_header') => {
    let margins: PadMargins;
    if (preset === 'standard') {
      margins = { top: 3.0, bottom: 1.0, left: 0.8, right: 0.8 };
    } else if (preset === 'compact') {
      margins = { top: 2.0, bottom: 0.8, left: 0.6, right: 0.6 };
    } else {
      margins = { top: 3.5, bottom: 1.0, left: 0.8, right: 0.8 };
    }
    const updatedSettings: SchoolSettings = {
      ...settings,
      padMargins: margins,
    };
    setSettings(updatedSettings);
  };

  // Save full settings
  const handleSave = () => {
    settingsService.updateSettings(settings);
    setSavedSuccess(true);
    setAlertMsg({ type: 'success', text: 'প্যাড ও মার্জিন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' });
    if (onSaved) onSaved(settings);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const currentMargins = settings.padMargins || DEFAULT_PAD_MARGINS;
  const activeMode = settings.activePadMode || (settings.uploadedPadTemplateUrl ? 'uploaded' : 'preprinted');

  return (
    <div className={`pad-settings-container ${isModal ? 'bg-white rounded-3xl p-6 shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-y-auto' : 'space-y-6'}`}>
      
      {/* ─── HEADER BAR ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <FileText size={20} />
            </span>
            লেটারহেড প্যাড ও মার্জিন কন্ট্রোল প্যানেল
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            আপনার প্রতিষ্ঠানের তৈরি করা নিজস্ব পিডিএফ বা ছবির প্যাড আপলোড করুন এবং লেখার অবস্থান ও স্বাক্ষরের অটো-স্কেলিং মার্জিন ক্যালিব্রেট করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            {savedSuccess ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {savedSuccess ? 'সংরক্ষিত হয়েছে!' : 'সেটিংস সংরক্ষণ করুন'}
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="বন্ধ করুন"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* ─── ALERT NOTIFICATION ──────────────────────────────────────── */}
      {alertMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── 1. MODE SELECTOR (2 REAL MODES: UPLOADED VS PRE-PRINTED) ─── */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
          প্যাড ব্যবহারের মোড নির্বাচন করুন:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Mode 1: Custom Uploaded Pad */}
          <div
            onClick={() => handleModeSelect('uploaded')}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
              activeMode === 'uploaded'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Upload size={18} />
                </span>
                {activeMode === 'uploaded' && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> সক্রিয়
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">১. আপলোডকৃত নিজস্ব প্যাড (PDF বা ছবি)</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                আপনার প্রতিষ্ঠানের নিজস্ব প্রেস-প্রিন্টেড প্যাডের স্ক্যান কপি বা ডিজিটাল PDF আপলোড করুন। প্রত্যয়নপত্রের যাবতীয় লেখা স্বয়ংক্রিয়ভাবে এই প্যাডের ভেতর নির্ধারিত মার্জিনে বসে যাবে।
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-indigo-700">
              {settings.uploadedPadTemplateUrl ? '✓ নিজস্ব প্যাড আপলোড করা আছে' : '⚠ প্যাড আপলোড করুন'}
            </div>
          </div>

          {/* Mode 2: Pre-printed Paper Pad */}
          <div
            onClick={() => handleModeSelect('preprinted')}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
              activeMode === 'preprinted'
                ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Printer size={18} />
                </span>
                {activeMode === 'preprinted' && (
                  <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-black rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> সক্রিয়
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">২. ছাপা প্যাড (Pre-printed Paper)</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                আপনার প্রিন্টারে আগে থেকেই ছাপানো প্যাড পেপার থাকলে এই মোড নির্বাচন করুন। সফটওয়্যারে কোনো ব্যাকগ্রাউন্ড আসবে না, শুধু নির্ধারিত মার্জিনে লেখা প্রিন্ট হবে।
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-amber-700">
              হেডার ও ফুটার ফাঁকা রেখে শুধু টেক্সট প্রিন্ট
            </div>
          </div>

        </div>
      </div>

      {/* ─── 2. TAB NAVIGATION ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border-b-2 ${
            activeTab === 'upload'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload size={14} /> প্যাড আপলোড (PDF/ছবি)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('margins')}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border-b-2 ${
            activeTab === 'margins'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders size={14} /> মার্জিন ও টেক্সট স্কেলিং কাস্টমাইজেশন
        </button>
      </div>

      {/* ─── 3. TAB CONTENTS & LIVE PREVIEW GRID ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* ═══════ TAB 1: UPLOAD (PDF / IMAGE) ═══════ */}
          {activeTab === 'upload' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Upload size={16} className="text-indigo-600" />
                    লেটারহেড প্যাড ফাইল আপলোড
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    প্রতিষ্ঠানের অফিসিয়াল PDF প্যাড অথবা স্ক্যান করা হাই-রেজ্যুলেশন PNG/JPG ছবি আপলোড করুন।
                  </p>
                </div>
                {settings.uploadedPadTemplateUrl && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-lg border border-emerald-300">
                    প্যাড লোডেড
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-6 bg-indigo-50/30 text-center transition">
                {isProcessing ? (
                  <div className="py-6 space-y-3">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-indigo-900">{processStatus}</p>
                    <p className="text-[11px] text-slate-500">A4 সাইজে অটো-স্কেলিং করা হচ্ছে...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        আপনার প্রতিষ্ঠানের প্যাড ফাইল নির্বাচন করুন
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        সাপোর্টেড ফরম্যাট: <strong>PDF (.pdf)</strong>, <strong>PNG</strong>, <strong>JPG/JPEG</strong>
                      </p>
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer active:scale-95">
                        <Upload size={15} />
                        ব্রাউজ করে ফাইল সিলেক্ট করুন
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Pad Details Card */}
              {settings.uploadedPadTemplateUrl && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                        {settings.uploadedPadType === 'pdf' ? 'PDF' : 'IMG'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">
                          {settings.uploadedPadFileName || 'স্কুল লেটারহেড প্যাড ফাইল'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {settings.uploadedPadFileSize ? `${Math.round(settings.uploadedPadFileSize / 1024)} KB • ` : ''}
                          {settings.uploadedPadType === 'pdf' ? 'পিডিএফ থেকে কনভার্টকৃত হাই-রেজ্যুলেশন ব্যাকগ্রাউন্ড' : 'ছবি ব্যাকগ্রাউন্ড'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemovePad}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} /> প্যাড মুছুন
                    </button>
                  </div>

                  <div className="p-2.5 bg-indigo-50/70 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
                    <Info size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>অটো লিখা ও মার্জিন:</strong> আপলোড করা প্যাডের হেডারের লেখার নিচে প্রত্যয়নের টেক্সট নিখুঁতভাবে বসানোর জন্য <strong>মার্জিন কাস্টমাইজেশন</strong> ট্যাবে গিয়ে <strong>টপ মার্জিন</strong> এডজাস্ট করুন।
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════ TAB 2: MARGIN & TEXT SCALING CONTROLS ═══════ */}
          {activeTab === 'margins' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Sliders size={16} className="text-indigo-600" />
                    মার্জিন ও টেক্সট স্কেলিং কাস্টমাইজেশন
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    লেখা ও স্বাক্ষরের সঠিক অবস্থান ও ফন্ট সাইজ নির্ধারণ করুন।
                  </p>
                </div>

                {/* Preset Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyPreset('standard')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                    title="আদর্শ মার্জিন (Top: 3.0in, Bottom: 1.0in)"
                  >
                    স্ট্যান্ডার্ড (৩.০&quot;)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('compact')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                    title="ছোট হেডারের জন্য (Top: 2.0in)"
                  >
                    কম্প্যাক্ট (২.০&quot;)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('large_header')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                    title="বড় হেডারের জন্য (Top: 3.5in)"
                  >
                    বড় হেডার (৩.৫&quot;)
                  </button>
                </div>
              </div>

              {/* Margin Inputs Grid */}
              <div className="space-y-3.5 pt-2">
                
                {/* 1. TOP MARGIN */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900">টপ মার্জিন (হেডার স্পেস)</span>
                      <p className="text-[10px] text-slate-500">
                        আপলোড করা প্যাডের হেডারের লেখার নিচে প্রত্যয়নের মূল বক্তব্য শুরু হওয়ার দূরত্ব
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => stepMargin('top', -0.1)}
                        className="w-7 h-7 bg-white border border-slate-300 rounded-lg font-black text-sm flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-16 text-center font-mono font-black text-sm text-indigo-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        {currentMargins.top}&quot;
                      </span>
                      <button
                        type="button"
                        onClick={() => stepMargin('top', 0.1)}
                        className="w-7 h-7 bg-white border border-slate-300 rounded-lg font-black text-sm flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.5"
                    step="0.05"
                    value={currentMargins.top}
                    onChange={(e) => updateMargin('top', parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>কম (0.5&quot;)</span>
                    <span className="text-indigo-600 font-bold">{(currentMargins.top * 25.4).toFixed(0)} mm</span>
                    <span>বেশি (4.5&quot;)</span>
                  </div>
                </div>

                {/* 2. BOTTOM MARGIN */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900">বটম মার্জিন (ফুটার স্পেস)</span>
                      <p className="text-[10px] text-slate-500">
                        পৃষ্ঠার নিচ থেকে ন্যূনতম দূরত্ব যাতে প্যাডের ফুটারে লেখা না লাগে
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => stepMargin('bottom', -0.1)}
                        className="w-7 h-7 bg-white border border-slate-300 rounded-lg font-black text-sm flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-16 text-center font-mono font-black text-sm text-indigo-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        {currentMargins.bottom}&quot;
                      </span>
                      <button
                        type="button"
                        onClick={() => stepMargin('bottom', 0.1)}
                        className="w-7 h-7 bg-white border border-slate-300 rounded-lg font-black text-sm flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={currentMargins.bottom}
                    onChange={(e) => updateMargin('bottom', parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>কম (0.5&quot;)</span>
                    <span className="text-indigo-600 font-bold">{(currentMargins.bottom * 25.4).toFixed(0)} mm</span>
                    <span>বেশি (3.0&quot;)</span>
                  </div>
                </div>

                {/* 3. LEFT & RIGHT MARGINS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">বাম মার্জিন (Left)</span>
                      <span className="font-mono font-bold text-xs text-indigo-700">{currentMargins.left}&quot;</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.5"
                      step="0.05"
                      value={currentMargins.left}
                      onChange={(e) => updateMargin('left', parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">ডান মার্জিন (Right)</span>
                      <span className="font-mono font-bold text-xs text-indigo-700">{currentMargins.right}&quot;</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.5"
                      step="0.05"
                      value={currentMargins.right}
                      onChange={(e) => updateMargin('right', parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 4. PRINCIPAL SIGNATURE AUTO-SCALING GAP */}
                <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                        প্রধান শিক্ষকের স্বাক্ষরের অটো-স্কেলিং ব্যবধান
                      </span>
                      <p className="text-[10px] text-indigo-700">
                        বক্তব্য শেষ হবার পর স্বাক্ষরের মধ্যকার স্বয়ংক্রিয় ফাঁকা দূরত্ব
                      </p>
                    </div>
                    <span className="font-mono font-black text-xs text-indigo-700 bg-white px-2 py-1 rounded-lg border border-indigo-200">
                      {settings.padSignatureGap || 2.5} rem
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.25"
                    value={settings.padSignatureGap || 2.5}
                    onChange={(e) => setSettings({ ...settings, padSignatureGap: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>কাছাকাছি (1.0 rem)</span>
                    <span>আদর্শ (2.5 rem)</span>
                    <span>দূরবর্তী (5.0 rem)</span>
                  </div>
                </div>

                {/* 5. TYPOGRAPHY SCALING (FONT SIZE & LINE HEIGHT) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                        <Type size={12} /> ফন্ট সাইজ
                      </span>
                      <span className="font-mono font-bold text-xs text-indigo-700">{settings.padFontSize || 14} px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="18"
                      step="0.5"
                      value={settings.padFontSize || 14}
                      onChange={(e) => setSettings({ ...settings, padFontSize: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">লাইন ব্যবধান (Line Height)</span>
                      <span className="font-mono font-bold text-xs text-indigo-700">{settings.padLineHeight || 2.1}</span>
                    </div>
                    <input
                      type="range"
                      min="1.6"
                      max="2.6"
                      step="0.1"
                      value={settings.padLineHeight || 2.1}
                      onChange={(e) => setSettings({ ...settings, padLineHeight: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Right Column: Interactive Live Pad Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Eye size={14} className="text-indigo-600" />
              লাইভ A4 শিট প্রিভিউ
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              A4 Portrait (210×297mm)
            </span>
          </div>

          {/* Interactive Scale Wrapper */}
          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-inner flex items-center justify-center overflow-hidden">
            <div
              className="origin-top transform scale-[0.52] sm:scale-[0.58] lg:scale-[0.52] shadow-2xl transition-all duration-300"
              style={{
                width: '210mm',
                height: '297mm',
              }}
            >
              <SchoolPadWrapper
                settings={settings}
                mode={activeMode === 'preprinted' ? 'preprinted' : 'full_pad'}
                title="চারিত্রিক সনদ পত্র"
                refNo="ব.উ.বি/সনদ/২০২৬/৩৪৮"
                hideHeaderActions={true}
                signatures={[
                  {
                    title: settings.principalName || 'মোহাম্মদ রফিকুল ইসলাম',
                    designation: settings.principalTitle || 'প্রধান শিক্ষক',
                    institution: settings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
                    address: settings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
                    rightAligned: true,
                  },
                ]}
              >
                <div className="space-y-3 pt-1">
                  <p className="leading-loose text-justify indent-6">
                    এই মর্মে <strong className="font-black text-slate-950 font-serif">চারিত্রিক সনদ পত্র</strong> প্রদান করা যাচ্ছে যে, <strong className="font-black text-slate-950 underline">মোঃ তানভীর হাসান</strong>, পিতা: মোঃ আবদুল মান্নান, মাতা: খালেদা বেগম, গ্রাম: বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার।
                  </p>
                  <p className="leading-loose text-justify indent-6">
                    সে এই বিদ্যালয়ের দশম শ্রেণির বিজ্ঞান বিভাগের একজন নিয়মিত শিক্ষার্থী (রোল: ০১, শিক্ষাবর্ষ: ২০২৫-২০২৬)। ভর্তিবহি অনুযায়ী তার জন্ম তারিখ: ১৫/০৫/২০১০ খ্রি.।
                  </p>
                  <p className="leading-loose text-justify indent-6">
                    বিদ্যালয়ে অধ্যয়নকালে তার চরিত্র, আচার-আচরণ ও স্বভাব অত্যন্ত সন্তোষজনক ও প্রশংসনীয় ছিল। সে রাষ্ট্রবিরোধী কোনো কর্মকাণ্ডে জড়িত নয়।
                  </p>
                  <p className="leading-loose text-justify indent-6">
                    আমি তার জীবনের সর্বাঙ্গীন উন্নতি ও উজ্জ্বল ভবিষ্যৎ কামনা করি।
                  </p>
                </div>
              </SchoolPadWrapper>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
            <p className="font-bold flex items-center gap-1 text-emerald-800">
              <CheckCircle2 size={14} className="text-emerald-600" /> অটো-স্কেলিং সিগনেচার ফ্লো:
            </p>
            <p className="text-[10.5px] leading-relaxed text-emerald-900">
              বক্তব্যের দৈর্ঘ্য অনুযায়ী প্রধান শিক্ষকের স্বাক্ষর ও ৪-স্তরের পদবী সরাসরি লিখা শেষ হবার পরে স্বয়ংক্রিয়ভাবে ডানপাশে অবস্থান নেয়।
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
