'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Bus,
  Building2,
  Plus,
  Trash2,
  Printer,
  ArrowLeft,
  UserCheck,
  MapPin,
  BedDouble,
  Search,
} from 'lucide-react';
import {
  campusFacilityService,
  TransportRoute,
  TransportAssignment,
  HostelRoom,
  HostelAllocation,
} from '@/services/campusFacilityService';
import { studentService, Student } from '@/services/studentService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';

type CampusTab = 'transport' | 'hostel';

export default function CampusFacilitiesPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<CampusTab>('transport');
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [transportAssignments, setTransportAssignments] = useState<TransportAssignment[]>([]);
  const [hostelRooms, setHostelRooms] = useState<HostelRoom[]>([]);
  const [hostelAllocations, setHostelAllocations] = useState<HostelAllocation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  // Transport Route Form
  const [routeCode, setRouteCode] = useState('');
  const [routeName, setRouteName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [stopsText, setStopsText] = useState('');
  const [routeFee, setRouteFee] = useState<number>(800);
  const [routeCapacity, setRouteCapacity] = useState<number>(40);

  // Assign Student to Transport
  const [trGrade, setTrGrade] = useState('all');
  const [trQuery, setTrQuery] = useState('');
  const [trStudentId, setTrStudentId] = useState('');
  const [trRouteId, setTrRouteId] = useState('');
  const [trStopName, setTrStopName] = useState('');

  // Hostel Room Form
  const [building, setBuilding] = useState('মূল ছাত্রাবাস');
  const [roomNo, setRoomNo] = useState('');
  const [floor, setFloor] = useState('২য় তলা');
  const [roomCapacity, setRoomCapacity] = useState<number>(4);
  const [roomFee, setRoomFee] = useState<number>(3500);

  // Allocate Hostel Bed
  const [hsGrade, setHsGrade] = useState('all');
  const [hsQuery, setHsQuery] = useState('');
  const [hsStudentId, setHsStudentId] = useState('');
  const [hsRoomId, setHsRoomId] = useState('');
  const [hsBedNo, setHsBedNo] = useState('');

  const loadData = useCallback(() => {
    setRoutes(campusFacilityService.getTransportRoutes());
    setTransportAssignments(campusFacilityService.getTransportAssignments());
    setHostelRooms(campusFacilityService.getHostelRooms());
    setHostelAllocations(campusFacilityService.getHostelAllocations());
    setStudents(studentService.getAllStudents());
    setSettings(settingsService.getSettings());
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
    const onStorage = () => loadData();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadData]);

  const selectedRoute = useMemo(() => routes.find((r) => r.id === trRouteId) || null, [routes, trRouteId]);

  const transportCandidates = useMemo(() => {
    const q = trQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (trGrade !== 'all' && s.grade !== trGrade) return false;
      if (q && !`${s.name} ${s.roll}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, trGrade, trQuery]);

  const hostelCandidates = useMemo(() => {
    const q = hsQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (hsGrade !== 'all' && s.grade !== hsGrade) return false;
      if (q && !`${s.name} ${s.roll}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, hsGrade, hsQuery]);

  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeCode.trim() || !routeName.trim()) {
      showToast('রুট কোড ও রুটের নাম আবশ্যক।', 'error');
      return;
    }
    const stops = stopsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    campusFacilityService.saveTransportRoute({
      routeCode: routeCode.trim(),
      routeName: routeName.trim(),
      vehicleNo: vehicleNo.trim() || 'গাড়ি-০১',
      driverName: driverName.trim() || 'নির্ধারিত চালক',
      driverPhone: driverPhone.trim(),
      stops: stops.length > 0 ? stops : ['মূল গেট'],
      monthlyFee: Math.max(0, Number(routeFee) || 0),
      capacity: Math.max(1, Number(routeCapacity) || 40),
    });
    showToast('পরিবহন রুট সংরক্ষণ করা হয়েছে!', 'success');
    setRouteCode('');
    setRouteName('');
    setVehicleNo('');
    setDriverName('');
    setDriverPhone('');
    setStopsText('');
    loadData();
  };

  const handleAssignTransport = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === trStudentId);
    if (!st || !trRouteId) {
      showToast('অনুগ্রহ করে শিক্ষার্থী এবং বাস রুট নির্বাচন করুন।', 'error');
      return;
    }
    const res = campusFacilityService.assignStudentToRoute({
      studentId: st.id,
      studentName: st.name,
      roll: st.roll,
      grade: st.grade,
      routeId: trRouteId,
      stopName: trStopName || selectedRoute?.stops[0] || 'মূল স্টপেজ',
    });
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) {
      setTrStudentId('');
      loadData();
    }
  };

  const handleDeleteRoute = async (route: TransportRoute) => {
    const ok = await confirmDialog({
      title: 'বাস রুট মুছে ফেলুন',
      message: `আপনি কি "${route.routeName}" (${route.routeCode}) রুট এবং সংশ্লিষ্ট বরাদ্দ মুছে ফেলতে চান?`,
      confirmLabel: 'মুছুন',
      cancelLabel: 'বাতিল',
      danger: true,
    });
    if (!ok) return;
    campusFacilityService.deleteTransportRoute(route.id);
    showToast('বাস রুট অপসারণ করা হয়েছে।', 'success');
    loadData();
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNo.trim() || !building.trim()) {
      showToast('ভবন ও কক্ষ নম্বর আবশ্যক।', 'error');
      return;
    }
    campusFacilityService.saveHostelRoom({
      building: building.trim(),
      roomNo: roomNo.trim(),
      floor: floor.trim() || '১ম তলা',
      capacity: Math.max(1, Number(roomCapacity) || 4),
      monthlyFee: Math.max(0, Number(roomFee) || 0),
    });
    showToast('হোস্টেল কক্ষ যুক্ত হয়েছে!', 'success');
    setRoomNo('');
    loadData();
  };

  const handleAllocateBed = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === hsStudentId);
    if (!st || !hsRoomId) {
      showToast('অনুগ্রহ করে শিক্ষার্থী এবং হোস্টেল কক্ষ নির্বাচন করুন।', 'error');
      return;
    }
    const res = campusFacilityService.allocateHostelBed({
      studentId: st.id,
      studentName: st.name,
      roll: st.roll,
      grade: st.grade,
      roomId: hsRoomId,
      bedNo: hsBedNo.trim(),
    });
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) {
      setHsStudentId('');
      setHsBedNo('');
      loadData();
    }
  };

  const handleDeleteRoom = async (room: HostelRoom) => {
    const ok = await confirmDialog({
      title: 'হোস্টেল কক্ষ মুছুন',
      message: `আপনি কি ${room.building} - কক্ষ ${room.roomNo} এবং এর সকল সিট বরাদ্দ মুছে ফেলতে চান?`,
      confirmLabel: 'মুছুন',
      cancelLabel: 'বাতিল',
      danger: true,
    });
    if (!ok) return;
    campusFacilityService.deleteHostelRoom(room.id);
    showToast('হোস্টেল কক্ষ মুছে ফেলা হয়েছে।', 'success');
    loadData();
  };

  if (!mounted) {
    return (
      <div className="p-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
        পরিবহন ও হোস্টেল ব্যবস্থাপনা লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 space-y-6">
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          .no-print { display: none !important; }
          body { background: #ffffff !important; color: #0f172a !important; }
        }
      `}</style>

      {/* Print Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-xl font-black">{settings?.schoolName || 'স্মার্ট স্কুল অ্যান্ড কলেজ'}</h1>
        <p className="text-xs font-bold text-slate-600">
          {activeTab === 'transport' ? 'স্কুল পরিবহন ও বাস রুট রোস্টার' : 'আবাসিক হোস্টেল কক্ষ ও সিট বরাদ্দ তালিকা'}
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs no-print">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shrink-0">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              পরিবহন (বাস রুট) ও হোস্টেল সিট ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              রুট কোড, স্টপেজ, আসন ধারণক্ষমতা যাচাই এবং আবাসিক শিক্ষার্থীদের সিট বরাদ্দ ট্র্যাকিং
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> ড্যাশবোর্ড
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('transport')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition ${
            activeTab === 'transport'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Bus className="w-4 h-4" /> পরিবহন ও বাস রুট ({routes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hostel')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition ${
            activeTab === 'hostel'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" /> হোস্টেল ও আবাসিক বরাদ্দ ({hostelRooms.length})
        </button>
      </div>

      {/* TRANSPORT TAB */}
      {activeTab === 'transport' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-5 no-print">
            {/* Add Route */}
            <form
              onSubmit={handleSaveRoute}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <h2 className="text-sm font-black flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" /> নতুন বাস রুট তৈরি করুন
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={routeCode}
                  onChange={(e) => setRouteCode(e.target.value)}
                  placeholder="রুট কোড (R-01)"
                  required
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="রুটের নাম (চকরিয়া-ক্যাম্পাস)"
                  required
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="গাড়ি নং"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="চালকের নাম"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="চালকের মোবাইল"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <input
                type="text"
                value={stopsText}
                onChange={(e) => setStopsText(e.target.value)}
                placeholder="স্টপেজসমূহ কমা দিয়ে লিখুন (যেমন: চিরিংগা, বরইতলী, পহরচাঁদা)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">মাসিক ফি (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={routeFee}
                    onChange={(e) => setRouteFee(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">আসন সংখ্যা</label>
                  <input
                    type="number"
                    min={1}
                    value={routeCapacity}
                    onChange={(e) => setRouteCapacity(Math.max(1, Number(e.target.value) || 40))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black cursor-pointer"
              >
                রুট সংরক্ষণ করুন
              </button>
            </form>

            {/* Assign Student */}
            <form
              onSubmit={handleAssignTransport}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <h2 className="text-sm font-black flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" /> শিক্ষার্থী পরিবহন বরাদ্দ
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={trGrade}
                  onChange={(e) => setTrGrade(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="all">সকল শ্রেণি</option>
                  {['6th', '7th', '8th', '9th', '10th'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={trQuery}
                    onChange={(e) => setTrQuery(e.target.value)}
                    placeholder="নাম/রোল খুঁজুন"
                    className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>
              <select
                value={trStudentId}
                onChange={(e) => setTrStudentId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="">-- শিক্ষার্থী বাছুন ({transportCandidates.length}) --</option>
                {transportCandidates.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.grade} • রোল {s.roll})</option>
                ))}
              </select>
              <select
                value={trRouteId}
                onChange={(e) => {
                  const id = e.target.value;
                  setTrRouteId(id);
                  const found = routes.find((r) => r.id === id);
                  setTrStopName(found?.stops[0] || '');
                }}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="">-- বাস রুট নির্বাচন করুন --</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.routeCode} — {r.routeName} (৳{r.monthlyFee})</option>
                ))}
              </select>
              <select
                value={trStopName}
                onChange={(e) => setTrStopName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="">-- স্টপেজ --</option>
                {(selectedRoute?.stops || []).map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
              >
                বাসে যুক্ত করুন
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-5">
            {/* Routes List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-black">সক্রিয় বাস রুট ও আসন অবস্থা</h2>
              {routes.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center font-bold">এখনো কোনো বাস রুট যুক্ত হয়নি।</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {routes.map((r) => {
                    const count = transportAssignments.filter((a) => a.routeId === r.id && a.active).length;
                    return (
                      <div key={r.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              {r.routeCode} • {r.vehicleNo}
                            </span>
                            <h3 className="text-sm font-black mt-1">{r.routeName}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoute(r)}
                            className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded no-print cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold">
                          চালক: {r.driverName} {r.driverPhone ? `(${r.driverPhone})` : ''} • ফি: ৳{r.monthlyFee}/মাস
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" /> {r.stops.join(' → ')}
                        </p>
                        <div className="flex items-center justify-between text-[11px] font-black pt-1">
                          <span>আসন পূরণ: {count} / {r.capacity}</span>
                          <span className={count >= r.capacity ? 'text-rose-600' : 'text-emerald-600'}>
                            {Math.max(0, r.capacity - count)} খালি
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assigned Students Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-black">পরিবহন সুবিধাভোগী শিক্ষার্থী তালিকা ({transportAssignments.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                    <tr>
                      <th className="p-2.5 rounded-l-xl">শিক্ষার্থী</th>
                      <th className="p-2.5">রুট ও স্টপেজ</th>
                      <th className="p-2.5">মাসিক ফি</th>
                      <th className="p-2.5 rounded-r-xl text-right no-print">বাতিল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transportAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400 font-bold">কোনো বরাদ্দ নেই।</td>
                      </tr>
                    ) : (
                      transportAssignments.map((a) => (
                        <tr key={a.id}>
                          <td className="p-2.5">
                            <p className="font-black">{a.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{a.grade} • রোল {a.roll}</p>
                          </td>
                          <td className="p-2.5 font-bold">
                            {a.routeName}
                            <span className="block text-[10px] text-slate-400">স্টপেজ: {a.stopName}</span>
                          </td>
                          <td className="p-2.5 font-black text-emerald-600">৳{a.monthlyFee}</td>
                          <td className="p-2.5 text-right no-print">
                            <button
                              type="button"
                              onClick={() => {
                                campusFacilityService.removeTransportAssignment(a.id);
                                showToast('পরিবহন বরাদ্দ বাতিল করা হয়েছে।', 'info');
                                loadData();
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOSTEL TAB */}
      {activeTab === 'hostel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-5 no-print">
            <form
              onSubmit={handleSaveRoom}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <h2 className="text-sm font-black flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" /> নতুন হোস্টেল কক্ষ যোগ করুন
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="ভবনের নাম"
                  required
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="text"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  placeholder="কক্ষ নং (২০১)"
                  required
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="তলা"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="number"
                  min={1}
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(Math.max(1, Number(e.target.value) || 4))}
                  placeholder="সিট সংখ্যা"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="number"
                  min={0}
                  value={roomFee}
                  onChange={(e) => setRoomFee(Number(e.target.value) || 0)}
                  placeholder="মাসিক ফি"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
              >
                কক্ষ যুক্ত করুন
              </button>
            </form>

            <form
              onSubmit={handleAllocateBed}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <h2 className="text-sm font-black flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-emerald-600" /> আবাসিক সিট বরাদ্দ দিন
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={hsGrade}
                  onChange={(e) => setHsGrade(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="all">সকল শ্রেণি</option>
                  {['6th', '7th', '8th', '9th', '10th'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={hsQuery}
                  onChange={(e) => setHsQuery(e.target.value)}
                  placeholder="নাম/রোল খুঁজুন"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <select
                value={hsStudentId}
                onChange={(e) => setHsStudentId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="">-- শিক্ষার্থী বাছুন ({hostelCandidates.length}) --</option>
                {hostelCandidates.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.grade} • রোল {s.roll})</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={hsRoomId}
                  onChange={(e) => setHsRoomId(e.target.value)}
                  required
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="">-- কক্ষ বাছুন --</option>
                  {hostelRooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>{rm.building} — {rm.roomNo}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={hsBedNo}
                  onChange={(e) => setHsBedNo(e.target.value)}
                  placeholder="বেড নং (যেমন: Bed-1)"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
              >
                সিট বরাদ্দ দিন
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-black">হোস্টেল কক্ষসমূহ ও ধারণক্ষমতা</h2>
              {hostelRooms.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center font-bold">এখনো কোনো হোস্টেল কক্ষ যুক্ত হয়নি।</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hostelRooms.map((rm) => {
                    const occupied = hostelAllocations.filter((a) => a.roomId === rm.id && a.active).length;
                    return (
                      <div key={rm.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {rm.building} • {rm.floor}
                            </span>
                            <h3 className="text-sm font-black mt-1">কক্ষ নং: {rm.roomNo}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(rm)}
                            className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded no-print cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span>সিট: {occupied} / {rm.capacity}</span>
                          <span className="text-emerald-600">৳{rm.monthlyFee}/মাস</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-black">আবাসিক শিক্ষার্থী তালিকা ({hostelAllocations.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                    <tr>
                      <th className="p-2.5 rounded-l-xl">শিক্ষার্থী</th>
                      <th className="p-2.5">ভবন, কক্ষ ও বেড</th>
                      <th className="p-2.5">মাসিক ফি</th>
                      <th className="p-2.5 rounded-r-xl text-right no-print">বাতিল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {hostelAllocations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400 font-bold">কোনো আবাসিক বরাদ্দ নেই।</td>
                      </tr>
                    ) : (
                      hostelAllocations.map((a) => (
                        <tr key={a.id}>
                          <td className="p-2.5">
                            <p className="font-black">{a.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{a.grade} • রোল {a.roll}</p>
                          </td>
                          <td className="p-2.5 font-bold">
                            {a.building} (কক্ষ {a.roomNo})
                            <span className="block text-[10px] text-slate-400">বেড: {a.bedNo}</span>
                          </td>
                          <td className="p-2.5 font-black text-indigo-600">৳{a.monthlyFee}</td>
                          <td className="p-2.5 text-right no-print">
                            <button
                              type="button"
                              onClick={() => {
                                campusFacilityService.removeHostelAllocation(a.id);
                                showToast('হোস্টেল সিট বরাদ্দ বাতিল করা হয়েছে।', 'info');
                                loadData();
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
