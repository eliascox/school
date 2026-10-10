'use client';

import React, { useState, useEffect } from 'react';
import { 
  centralAdminService, 
  ExtendedSchoolData 
} from '@/services/centralAdminService';
import { 
  SchoolStatus, 
  LicensePlan, 
  UpdateReleaseManifest 
} from '@sms/shared-types';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Laptop,
  KeyRound,
  FileCheck,
  History,
  Building2,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  Radio,
  DownloadCloud,
  ChevronRight,
  ExternalLink,
  Award
} from 'lucide-react';

export default function SuperAdminPage() {
  const [schools, setSchools] = useState<ExtendedSchoolData[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, suspended: 0, rejected: 0, totalDevices: 0 });
  const [selectedTab, setSelectedTab] = useState<'ALL' | SchoolStatus | 'RELEASES' | 'AUDITS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<ExtendedSchoolData | null>(null);

  // Modals
  const [showApproveModal, setShowApproveModal] = useState<ExtendedSchoolData | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState<ExtendedSchoolData | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<ExtendedSchoolData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<ExtendedSchoolData | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Approval Form State
  const [approvePlan, setApprovePlan] = useState<LicensePlan>('STANDARD');
  const [approveDevices, setApproveDevices] = useState(2);
  const [approveDurationDays, setApproveDurationDays] = useState(365);

  // Suspension & Rejection Reason State
  const [actionReason, setActionReason] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    const list = centralAdminService.getSchools();
    setSchools(list);
    setStats(centralAdminService.getStats());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Schools
  const filteredSchools = schools.filter(s => {
    const matchesTab = selectedTab === 'ALL' ? true : s.status === selectedTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      s.schoolName.toLowerCase().includes(q) ||
      s.schoolCode.toLowerCase().includes(q) ||
      s.contactPhone.includes(q) ||
      s.district?.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  // Action Handlers
  const handleApprove = () => {
    if (!showApproveModal) return;
    try {
      centralAdminService.approveSchool(showApproveModal.id, {
        plan: approvePlan,
        maxDevices: approveDevices,
        validUntilDays: approveDurationDays,
        adminEmail: 'superadmin@schoolpro.com'
      });
      showToast(`স্কুল '${showApproveModal.schoolName}' সফলভাবে অনুমোদিত এবং Ed25519 লাইসেন্স জারি করা হয়েছে!`);
      setShowApproveModal(null);
      loadData();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleSuspend = () => {
    if (!showSuspendModal) return;
    if (!actionReason.trim()) {
      showToast('অনুগ্রহ করে স্থগিতকরণের সুনির্দিষ্ট কারণ উল্লেখ করুন', 'error');
      return;
    }
    try {
      centralAdminService.suspendSchool(showSuspendModal.id, actionReason, 'superadmin@schoolpro.com');
      showToast(`স্কুল '${showSuspendModal.schoolName}' সাময়িকভাবে স্থগিত করা হয়েছে। ক্লায়েন্ট ডেস্কটপ লক হয়ে যাবে।`, 'error');
      setShowSuspendModal(null);
      setActionReason('');
      loadData();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleReactivate = (school: ExtendedSchoolData) => {
    try {
      centralAdminService.reactivateSchool(school.id, 'superadmin@schoolpro.com');
      showToast(`স্কুল '${school.schoolName}' পুনরায় সক্রিয় করা হয়েছে!`);
      loadData();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleReject = () => {
    if (!showRejectModal) return;
    try {
      centralAdminService.rejectSchool(showRejectModal.id, actionReason || 'তথ্য অপর্যাপ্ত বা অসম্পূর্ণ।', 'superadmin@schoolpro.com');
      showToast(`স্কুল আবেদনটি বাতিল করা হয়েছে।`, 'error');
      setShowRejectModal(null);
      setActionReason('');
      loadData();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── 1. TOP HEADER & BRANDING ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <ShieldCheck size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                SchoolPro Central Command
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              কেন্দ্রীয় স্কুল রেজিস্ট্রেশন অনুমোদন, ক্রিপ্টোগ্রাফিক লাইসেন্সিং, রিমোট লকআউট ও আপডেট কনসোল
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-700/80 text-xs text-right">
            <span className="text-[10px] text-slate-400 block font-medium">লগইন এডমিন:</span>
            <span className="font-bold text-emerald-400 font-mono">superadmin@schoolpro.com</span>
          </div>
          <button
            onClick={loadData}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 transition cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* ─── 2. KPI SYSTEM METRICS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 block">মোট প্রতিষ্ঠান</span>
          <span className="text-2xl font-black text-white">{stats.total}</span>
        </div>

        <div className={`p-4 rounded-2xl border transition space-y-1 ${
          stats.pending > 0 
            ? 'bg-amber-950/40 border-amber-500/40 animate-pulse' 
            : 'bg-slate-900/80 border-slate-800/80'
        }`}>
          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
            <Clock size={13} /> পেন্ডিং অনুমোদন
          </span>
          <span className="text-2xl font-black text-amber-400">{stats.pending}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={13} /> সক্রিয় লাইসেন্স
          </span>
          <span className="text-2xl font-black text-emerald-400">{stats.active}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
            <AlertTriangle size={13} /> স্থগিত স্কুল (Locked)
          </span>
          <span className="text-2xl font-black text-rose-400">{stats.suspended}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <XCircle size={13} /> বাতিল আবেদন
          </span>
          <span className="text-2xl font-black text-slate-400">{stats.rejected}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
            <Laptop size={13} /> সংযুক্ত হার্ডওয়্যার পিসি
          </span>
          <span className="text-2xl font-black text-indigo-400">{stats.totalDevices}</span>
        </div>
      </div>

      {/* ─── 3. TAB CONTROLS & SEARCH ─── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            onClick={() => setSelectedTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedTab === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            সবগুলো ({stats.total})
          </button>

          <button
            onClick={() => setSelectedTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              selectedTab === 'PENDING' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock size={13} /> পেন্ডিং অনুমোদন ({stats.pending})
          </button>

          <button
            onClick={() => setSelectedTab('APPROVED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              selectedTab === 'APPROVED' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 size={13} /> সক্রিয় স্কুল ({stats.active})
          </button>

          <button
            onClick={() => setSelectedTab('SUSPENDED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              selectedTab === 'SUSPENDED' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock size={13} /> স্থগিত স্কুল ({stats.suspended})
          </button>

          <button
            onClick={() => setSelectedTab('RELEASES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              selectedTab === 'RELEASES' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DownloadCloud size={13} /> সফটওয়্যার রিলিজ ও আপডেট
          </button>
        </div>

        {/* Search */}
        {selectedTab !== 'RELEASES' && (
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="text"
              placeholder="স্কুলের নাম, কোড, ফোন বা জেলা..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* ─── 4. MAIN CONTENT AREA: SCHOOLS TABLE OR RELEASES ─── */}
      {selectedTab !== 'RELEASES' ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">প্রতিষ্ঠান ও কোড</th>
                  <th className="p-4">ঠিকানা ও জেলা</th>
                  <th className="p-4">প্রধান শিক্ষক ও যোগাযোগ</th>
                  <th className="p-4 text-center">সংযুক্ত পিসি</th>
                  <th className="p-4">লাইসেন্স মেয়াদ</th>
                  <th className="p-4 text-center">স্ট্যাটাস</th>
                  <th className="p-4 text-right">একশন ও কন্ট্রোল</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 font-bold">
                      কোনো প্রতিষ্ঠানের রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredSchools.map((school) => (
                    <tr key={school.id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Code */}
                      <td className="p-4">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <Building2 size={16} className="text-indigo-400 shrink-0" />
                          <span>{school.schoolName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] text-indigo-400 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                            {school.schoolCode}
                          </span>
                          {school.eiinNumber && (
                            <span className="text-[10px] text-slate-400">EIIN: {school.eiinNumber}</span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="p-4 text-slate-300">
                        <div>{school.upazila}, {school.district}</div>
                        <div className="text-[10px] text-slate-500">{school.address}</div>
                      </td>

                      {/* Principal & Phone */}
                      <td className="p-4 text-slate-300">
                        <div className="font-medium text-slate-200">{school.principalName}</div>
                        <div className="font-mono text-emerald-400 text-[11px] font-bold">{school.contactPhone}</div>
                      </td>

                      {/* Devices */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          <Laptop size={12} className="text-indigo-400" />
                          {school.devices?.length || 0} / {school.license?.maxDevices || 2}
                        </span>
                      </td>

                      {/* License */}
                      <td className="p-4">
                        {school.license ? (
                          <div>
                            <span className="font-mono text-[10px] font-black text-amber-400 block">
                              {school.license.licenseKey}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              মেয়াদ: {new Date(school.license.validUntil).toLocaleDateString('bn-BD')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">লাইসেন্স নেই</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-4 text-center">
                        {school.status === 'PENDING' && (
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                            <Clock size={12} /> পেন্ডিং
                          </span>
                        )}
                        {school.status === 'APPROVED' && (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> সক্রিয়
                          </span>
                        )}
                        {school.status === 'SUSPENDED' && (
                          <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                            <Lock size={12} /> স্থগিত (Locked)
                          </span>
                        )}
                        {school.status === 'REJECTED' && (
                          <span className="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                            <XCircle size={12} /> বাতিল
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Button */}
                          {school.status === 'PENDING' && (
                            <button
                              onClick={() => setShowApproveModal(school)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 size={13} /> অনুমোদন
                            </button>
                          )}

                          {/* Reject Button */}
                          {school.status === 'PENDING' && (
                            <button
                              onClick={() => setShowRejectModal(school)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                            >
                              বাতিল
                            </button>
                          )}

                          {/* Suspend Button (Active school) */}
                          {school.status === 'APPROVED' && (
                            <button
                              onClick={() => setShowSuspendModal(school)}
                              className="px-2.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                              title="স্কুল সাময়িক স্থগিত করুন (রিমোট লক ট্রিগার হবে)"
                            >
                              <Lock size={12} /> স্থগিত
                            </button>
                          )}

                          {/* Reactivate Button (Suspended school) */}
                          {school.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleReactivate(school)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-1 cursor-pointer"
                            >
                              <Unlock size={13} /> সক্রিয় করুন
                            </button>
                          )}

                          {/* Details Button */}
                          <button
                            onClick={() => setShowDetailsModal(school)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                            title="বিস্তারিত ও ডিভাইস দেখুন"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── RELEASES & AUTO-UPDATE TAB ─── */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <DownloadCloud className="text-violet-400" size={20} />
                ডেস্কটপ সফটওয়্যার রিলিজ ও অটো-আপডেট ম্যানেজমেন্ট
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                সেন্ট্রাল সার্ভার থেকে নতুন রিলিজ পুশ করলে সকল উইন্ডোজ পিসি স্বয়ংক্রিয়ভাবে নোটিফিকেশন পাবে।
              </p>
            </div>
            <button
              onClick={() => setShowPublishModal(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              + নতুন রিলিজ পাবলিশ করুন
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {centralAdminService.getReleases().map((rel) => (
              <div key={rel.version} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white font-mono">v{rel.version}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {rel.releaseChannel}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(rel.publishedAt).toLocaleDateString('bn-BD')}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{rel.releaseNotes}</p>

                <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-[10px] font-mono text-slate-400">
                  <div className="truncate">
                    <span className="text-slate-500">SHA-256: </span>
                    <span className="text-indigo-400">{rel.sha256}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">Download: </span>
                    <span className="text-slate-300">{rel.downloadUrl}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL: APPROVE SCHOOL ─── */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <h3 className="font-black text-sm text-white">স্কুল অনুমোদন ও লাইসেন্স জারি</h3>
              </div>
              <button onClick={() => setShowApproveModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/60 text-xs">
              <span className="text-slate-400 block">প্রতিষ্ঠান:</span>
              <span className="font-bold text-white text-sm">{showApproveModal.schoolName}</span>
              <span className="text-[11px] font-mono text-indigo-400 block mt-0.5">{showApproveModal.schoolCode} • {showApproveModal.district}</span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">সাবস্ক্রিপশন প্ল্যান নির্বাচন করুন:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['STANDARD', 'PREMIUM', 'ENTERPRISE'] as LicensePlan[]).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setApprovePlan(plan)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        approvePlan === plan 
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">অনুমোদিত পিসি সংখ্যা:</label>
                  <select
                    value={approveDevices}
                    onChange={(e) => setApproveDevices(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value={1}>১ টি পিসি</option>
                    <option value={2}>২ টি পিসি (স্ট্যান্ডার্ড)</option>
                    <option value={5}>৫ টি পিসি (মাল্টিপল)</option>
                    <option value={10}>১০ টি পিসি</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">মেয়াদকাল:</label>
                  <select
                    value={approveDurationDays}
                    onChange={(e) => setApproveDurationDays(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value={30}>১ মাস (ট্রায়াল)</option>
                    <option value={180}>৬ মাস</option>
                    <option value={365}>১ বছর (স্ট্যান্ডার্ড)</option>
                    <option value={730}>২ বছর</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-[11px] text-emerald-300 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <ShieldCheck size={14} /> স্বয়ংক্রিয় ক্রিপ্টোগ্রাফিক প্রসেস:
                </span>
                <p>অনুমোদনের সাথে সাথে সার্ভারের Ed25519 প্রাইভেট কি দিয়ে ডিজিটাল সাইন্ড লাইসেন্স কি তৈরি হয়ে স্কুলের ক্লায়েন্টে পুশ হবে।</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowApproveModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} /> অনুমোদন ও লাইসেন্স ইস্যু করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: SUSPEND SCHOOL (REMOTE LOCKOUT TRIGGER) ─── */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-rose-500" size={20} />
                <h3 className="font-black text-sm text-white">স্কুল লাইসেন্স স্থগিতকরণ (রিমোট লকআউট)</h3>
              </div>
              <button onClick={() => setShowSuspendModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-xs text-rose-200 space-y-1.5">
              <span className="font-black flex items-center gap-1.5 text-rose-400">
                <Lock size={14} /> সতর্কবার্তা — রিমোট ডিভাইস লক কার্যকর হবে:
              </span>
              <p>
                আপনি <strong>{showSuspendModal.schoolName}</strong>-কে স্থগিত করতে যাচ্ছেন। এই স্কুলের সকল ডেস্কটপ ক্লায়েন্ট আগামী হার্টবিট চেক করার সাথে সাথে স্বয়ংক্রিয়ভাবে সেশন লগআউট হয়ে সফটওয়্যার লক হয়ে যাবে।
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-bold block">স্থগিতকরণের কারণ লিখুন (যা স্কুলের স্ক্রিনে প্রদর্শিত হবে):</label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="উদাহরণ: বাৎসরিক সফটওয়্যার সাবস্ক্রিপশন ফি অপরিশোধিত থাকায় সাময়িকভাবে স্থগিত করা হয়েছে..."
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowSuspendModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSuspend}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lock size={15} /> নিশ্চিত স্থগিত ও লক করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT REGISTRATION ─── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="text-slate-400" size={20} />
                <h3 className="font-black text-sm text-white">আবেদন বাতিলকরণ</h3>
              </div>
              <button onClick={() => setShowRejectModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              আপনি কি নিশ্চিতভাবে <strong>{showRejectModal.schoolName}</strong>-এর আবেদনটি বাতিল করতে চান?
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-bold block">বাতিলের কারণ লিখুন:</label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="বাতিলের কারণ লিখুন..."
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-xs"
              >
                আবেদন বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DRAWER / MODAL: SCHOOL DETAILS & HARDWARE DEVICES ─── */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <Building2 size={20} className="text-indigo-400" />
                  {showDetailsModal.schoolName}
                </h3>
                <span className="text-xs text-slate-400 font-mono">{showDetailsModal.schoolCode} • {showDetailsModal.division}, {showDetailsModal.district}</span>
              </div>
              <button onClick={() => setShowDetailsModal(null)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer">
                ✕
              </button>
            </div>

            {/* School Profile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-slate-500 block">প্রধান শিক্ষক:</span>
                <span className="font-bold text-white">{showDetailsModal.principalName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">ফোন নম্বর:</span>
                <span className="font-bold text-emerald-400 font-mono">{showDetailsModal.contactPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">ইমেইল:</span>
                <span className="font-bold text-slate-300 truncate block">{showDetailsModal.contactEmail || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">EIIN নম্বর:</span>
                <span className="font-bold text-indigo-400 font-mono">{showDetailsModal.eiinNumber || 'N/A'}</span>
              </div>
            </div>

            {/* License Block */}
            <div className="bg-indigo-950/20 border border-indigo-800/40 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <KeyRound size={15} /> লাইসেন্স ও ক্রিপ্টোগ্রাফিক অথেনটিসিটি
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ed25519 Verified
                </span>
              </div>
              {showDetailsModal.license ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">লাইসেন্স কী:</span>
                    <span className="font-bold text-amber-400">{showDetailsModal.license.licenseKey}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">প্ল্যান টাইপ:</span>
                    <span className="font-bold text-white">{showDetailsModal.license.planType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">অনুমোদিত পিসি:</span>
                    <span className="font-bold text-white">{showDetailsModal.license.maxDevices} টি</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">মেয়াদ উত্তীর্ণ:</span>
                    <span className="font-bold text-slate-300">{new Date(showDetailsModal.license.validUntil).toLocaleDateString('bn-BD')}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">এই প্রতিষ্ঠানের কোনো সক্রিয় লাইসেন্স নেই।</p>
              )}
            </div>

            {/* Connected Hardware Devices */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-300 flex items-center gap-2">
                <Laptop size={15} className="text-indigo-400" />
                সংযুক্ত হার্ডওয়্যার ডিভাইস ও ফিঙ্গারপ্রিন্ট ({showDetailsModal.devices?.length || 0} টি)
              </h4>

              {(!showDetailsModal.devices || showDetailsModal.devices.length === 0) ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                  এখনো কোনো ডেস্কটপ পিসি সংযুক্ত হয়নি।
                </div>
              ) : (
                <div className="space-y-2">
                  {showDetailsModal.devices.map((device, idx) => (
                    <div key={device.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Radio size={13} className="text-emerald-400 animate-pulse" />
                          <span>{device.deviceName}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-normal">({device.osInfo})</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-md mt-0.5">
                          SHA-256: {device.fingerprintHash}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-500 block">সর্বশেষ হার্টবিট:</span>
                        <span className="font-mono text-emerald-400 text-[11px] font-bold">
                          {device.lastHeartbeatAt ? new Date(device.lastHeartbeatAt).toLocaleTimeString('bn-BD') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit History */}
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                <History size={14} /> অডিট লগ হিস্ট্রি
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto text-[11px]">
                {showDetailsModal.auditLogs?.map((log, idx) => (
                  <div key={idx} className="p-2 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between text-slate-300 font-mono">
                    <span>{log.action} by {log.userEmail || 'System'}</span>
                    <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString('bn-BD')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PUBLISH NEW SOFTWARE RELEASE ─── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DownloadCloud className="text-violet-400" size={20} />
                <h3 className="font-black text-sm text-white">নতুন ডেস্কটপ রিলিজ পাবলিশ করুন</h3>
              </div>
              <button onClick={() => setShowPublishModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">ভার্সন নম্বর (e.g. 1.1.0):</label>
                <input
                  type="text"
                  defaultValue="1.1.0"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  id="rel_ver"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">রিলিজ নোটস (Release Notes):</label>
                <textarea
                  rows={3}
                  defaultValue="নতুন দ্রুতগতির মার্ক এন্ট্রি ও এটেন্ডেন্স রিপোর্ট সুবিধা যুক্ত করা হয়েছে।"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  id="rel_notes"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">প্যাকেজ SHA-256 হ্যাশ:</label>
                <input
                  type="text"
                  defaultValue="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-[11px]"
                  id="rel_sha"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  const verInput = (document.getElementById('rel_ver') as HTMLInputElement)?.value || '1.1.0';
                  const notesInput = (document.getElementById('rel_notes') as HTMLTextAreaElement)?.value || 'Release';
                  const shaInput = (document.getElementById('rel_sha') as HTMLInputElement)?.value || 'sha256';

                  centralAdminService.publishRelease({
                    version: verInput,
                    releaseChannel: 'STABLE',
                    minSupportedVersion: '1.0.0',
                    isCritical: false,
                    downloadUrl: `https://releases.schoolpro.com/desktop/SchoolPro-v${verInput}-Setup.exe`,
                    sha256: shaInput,
                    signature: 'MEQCID8jKk/3y9Z4jQ9W/Ed25519...',
                    packageSizeBytes: 27500000,
                    releaseNotes: notesInput,
                    publishedAt: new Date().toISOString()
                  });

                  showToast(`রিলিজ v${verInput} সফলভাবে প্রকাশিত হয়েছে! সকল ক্লায়েন্ট আপডেট নোটিফিকেশন পাবে।`);
                  setShowPublishModal(false);
                }}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-xs shadow-lg"
              >
                রিলিজ পাবলিশ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
