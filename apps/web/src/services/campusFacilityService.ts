'use client';

export interface TransportRoute {
  id: string;
  routeCode: string;
  routeName: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  stops: string[];
  monthlyFee: number;
  capacity: number;
}

export interface TransportAssignment {
  id: string;
  studentId: string;
  studentName: string;
  roll: string;
  grade: string;
  routeId: string;
  routeName: string;
  stopName: string;
  monthlyFee: number;
  active: boolean;
  assignedAt: string;
}

export interface HostelRoom {
  id: string;
  building: string;
  roomNo: string;
  floor: string;
  capacity: number;
  monthlyFee: number;
}

export interface HostelAllocation {
  id: string;
  roomId: string;
  roomNo: string;
  building: string;
  bedNo: string;
  studentId: string;
  studentName: string;
  roll: string;
  grade: string;
  monthlyFee: number;
  active: boolean;
  joinedAt: string;
}

const ROUTES_KEY = 'sms_campus_transport';
const TRANSPORT_ASSIGN_KEY = 'sms_campus_transport_assignments';
const HOSTEL_ROOMS_KEY = 'sms_hostel_rooms';
const HOSTEL_ALLOC_KEY = 'sms_hostel_allocations';

function readArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event('storage'));
}

export const campusFacilityService = {
  // ─── TRANSPORT ──────────────────────────────────────────────────────────
  getTransportRoutes(): TransportRoute[] {
    return readArray<TransportRoute>(ROUTES_KEY);
  },

  saveTransportRoute(route: Omit<TransportRoute, 'id'> & { id?: string }): TransportRoute {
    const all = this.getTransportRoutes();
    const record: TransportRoute = {
      ...route,
      id: route.id || `BUS-${Date.now()}`,
    };
    const exists = all.some((r) => r.id === record.id);
    const next = exists ? all.map((r) => (r.id === record.id ? record : r)) : [record, ...all];
    writeArray(ROUTES_KEY, next);
    return record;
  },

  deleteTransportRoute(routeId: string): void {
    writeArray(ROUTES_KEY, this.getTransportRoutes().filter((r) => r.id !== routeId));
    writeArray(TRANSPORT_ASSIGN_KEY, this.getTransportAssignments().filter((a) => a.routeId !== routeId));
  },

  getTransportAssignments(): TransportAssignment[] {
    return readArray<TransportAssignment>(TRANSPORT_ASSIGN_KEY);
  },

  assignStudentToRoute(payload: {
    studentId: string;
    studentName: string;
    roll: string;
    grade: string;
    routeId: string;
    stopName: string;
  }): { success: boolean; message: string } {
    const route = this.getTransportRoutes().find((r) => r.id === payload.routeId);
    if (!route) return { success: false, message: 'নির্বাচিত বাস রুট পাওয়া যায়নি।' };

    const all = this.getTransportAssignments();
    const activeCount = all.filter((a) => a.routeId === route.id && a.active).length;
    const alreadyOnSame = all.some((a) => a.studentId === payload.studentId && a.routeId === route.id && a.active);
    if (!alreadyOnSame && activeCount >= route.capacity) {
      return { success: false, message: `"${route.routeName}" বাসের সকল আসন (${route.capacity}টি) পূর্ণ হয়েছে।` };
    }

    const filtered = all.filter((a) => a.studentId !== payload.studentId);
    const rec: TransportAssignment = {
      id: `TRN-${Date.now()}`,
      studentId: payload.studentId,
      studentName: payload.studentName,
      roll: payload.roll,
      grade: payload.grade,
      routeId: route.id,
      routeName: route.routeName,
      stopName: payload.stopName || route.stops[0] || 'মূল স্টপেজ',
      monthlyFee: route.monthlyFee,
      active: true,
      assignedAt: new Date().toISOString().split('T')[0],
    };
    writeArray(TRANSPORT_ASSIGN_KEY, [rec, ...filtered]);
    return { success: true, message: `${payload.studentName}-কে "${route.routeName}" রুটে সংযুক্ত করা হয়েছে!` };
  },

  removeTransportAssignment(id: string): void {
    writeArray(TRANSPORT_ASSIGN_KEY, this.getTransportAssignments().filter((a) => a.id !== id));
  },

  // ─── HOSTEL ─────────────────────────────────────────────────────────────
  getHostelRooms(): HostelRoom[] {
    return readArray<HostelRoom>(HOSTEL_ROOMS_KEY);
  },

  saveHostelRoom(room: Omit<HostelRoom, 'id'> & { id?: string }): HostelRoom {
    const all = this.getHostelRooms();
    const record: HostelRoom = { ...room, id: room.id || `HRM-${Date.now()}` };
    const exists = all.some((r) => r.id === record.id);
    const next = exists ? all.map((r) => (r.id === record.id ? record : r)) : [record, ...all];
    writeArray(HOSTEL_ROOMS_KEY, next);
    return record;
  },

  deleteHostelRoom(roomId: string): void {
    writeArray(HOSTEL_ROOMS_KEY, this.getHostelRooms().filter((r) => r.id !== roomId));
    writeArray(HOSTEL_ALLOC_KEY, this.getHostelAllocations().filter((a) => a.roomId !== roomId));
  },

  getHostelAllocations(): HostelAllocation[] {
    return readArray<HostelAllocation>(HOSTEL_ALLOC_KEY);
  },

  allocateHostelBed(payload: {
    studentId: string;
    studentName: string;
    roll: string;
    grade: string;
    roomId: string;
    bedNo: string;
  }): { success: boolean; message: string } {
    const room = this.getHostelRooms().find((r) => r.id === payload.roomId);
    if (!room) return { success: false, message: 'নির্বাচিত হোস্টেল কক্ষ পাওয়া যায়নি।' };

    const all = this.getHostelAllocations();
    const occupied = all.filter((a) => a.roomId === room.id && a.active).length;
    const sameStudent = all.some((a) => a.studentId === payload.studentId && a.roomId === room.id && a.active);
    if (!sameStudent && occupied >= room.capacity) {
      return { success: false, message: `কক্ষ নং ${room.roomNo}-এর সকল সিট (${room.capacity}টি) পূর্ণ হয়েছে।` };
    }

    const filtered = all.filter((a) => a.studentId !== payload.studentId);
    const alloc: HostelAllocation = {
      id: `HST-${Date.now()}`,
      roomId: room.id,
      roomNo: room.roomNo,
      building: room.building,
      bedNo: payload.bedNo || `Bed-${occupied + 1}`,
      studentId: payload.studentId,
      studentName: payload.studentName,
      roll: payload.roll,
      grade: payload.grade,
      monthlyFee: room.monthlyFee,
      active: true,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    writeArray(HOSTEL_ALLOC_KEY, [alloc, ...filtered]);
    return { success: true, message: `${payload.studentName}-কে ${room.building} (কক্ষ ${room.roomNo}) বরাদ্দ দেওয়া হয়েছে!` };
  },

  removeHostelAllocation(id: string): void {
    writeArray(HOSTEL_ALLOC_KEY, this.getHostelAllocations().filter((a) => a.id !== id));
  },
};
