import { beforeEach, describe, expect, it, vi } from 'vitest';

const store: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  },
  configurable: true,
});
Object.defineProperty(globalThis, 'window', {
  value: { dispatchEvent: () => true },
  configurable: true,
});

import { attendanceService } from '../src/services/attendanceService';
import { smsService } from '../src/services/smsService';

describe('attendanceService QR, ZKTeco Biometric & Auto-Alert Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    localStorage.setItem(
      'sms_students',
      JSON.stringify([
        {
          id: 'STU-101',
          roll: '01',
          name: 'রাফি আহমেদ',
          grade: '6th',
          section: 'A',
          branch: 'A',
          guardian: 'করিম আহমেদ',
          mobile: '01711111111',
        },
        {
          id: 'STU-102',
          roll: '02',
          name: 'তানজিম ইসলাম',
          grade: '9th',
          section: 'A',
          group: 'বিজ্ঞান',
          guardian: 'হাবিবুল ইসলাম',
          mobile: '01822222222',
        },
      ])
    );
  });

  it('parses ID-card QR tokens, JSON payloads, and raw identifiers', () => {
    expect(attendanceService.parseStudentQrPayload('   ')).toBeNull();
    expect(attendanceService.parseStudentQrPayload('SMS-STU|STU-101|01|6th')).toEqual({
      raw: 'SMS-STU|STU-101|01|6th',
      studentId: 'STU-101',
      roll: '01',
      grade: '6th',
    });
    expect(attendanceService.parseStudentQrPayload('{"studentId":"STU-102","roll":"02"}')).toEqual({
      raw: '{"studentId":"STU-102","roll":"02"}',
      studentId: 'STU-102',
      roll: '02',
      grade: undefined,
    });
  });

  it('records QR check-in and check-out with timestamps and rejects unknown IDs', () => {
    const checkIn = attendanceService.recordQrCheckIn('SMS-STU|STU-101|01|6th', {
      date: '2026-11-14',
      mode: 'check-in',
      verificationMethod: 'qr',
      deviceId: 'GATE-1',
      customTime: '08:50',
    });
    expect(checkIn.success).toBe(true);
    expect(checkIn.student?.status).toBe('Present');
    expect(checkIn.student?.verificationMethod).toBe('qr');
    expect(checkIn.student?.checkInTime).toBe('08:50');

    const checkOut = attendanceService.recordQrCheckIn('STU-101', {
      date: '2026-11-14',
      mode: 'check-out',
      verificationMethod: 'qr',
      deviceId: 'GATE-1',
      customTime: '15:30',
    });
    expect(checkOut.success).toBe(true);
    expect(checkOut.student?.checkInTime).toBe('08:50');
    expect(checkOut.student?.checkOutTime).toBe('15:30');

    const unknown = attendanceService.recordQrCheckIn('SMS-STU|NO-SUCH|99|10th', { date: '2026-11-14' });
    expect(unknown.success).toBe(false);
  });

  it('imports ZKTeco ATTLog & CSV biometric punches into respective class attendance logs', () => {
    const sampleLog = [
      'USERID\tTIMESTAMP\tSTATUS\tDEVICE',
      'STU-101\t2026-11-14 08:42:00\t0\tZK-GATE',
      'STU-102,2026-11-14 15:45:00,out,ZK-MAIN',
      'UNKNOWN-999\t2026-11-14 09:00:00\t0\tZK-GATE',
    ].join('\n');

    const importRes = attendanceService.importZKTecoLogs(sampleLog, {
      defaultDate: '2026-11-14',
      deviceId: 'ZK-DEFAULT',
    });
    expect(importRes.importedCount).toBe(2);
    expect(importRes.skippedCount).toBe(1);
    expect(importRes.matchedStudents).toContain('রাফি আহমেদ');
    expect(importRes.matchedStudents).toContain('তানজিম ইসলাম');

    const class6 = attendanceService.getAttendance('2026-11-14', '6th', 'A');
    const st101 = class6.find((s) => s.id === 'STU-101');
    expect(st101?.verificationMethod).toBe('biometric');
    expect(st101?.checkInTime).toBe('08:42');

    const class9Sci = attendanceService.getAttendance('2026-11-14', '9th', 'Science');
    const st102 = class9Sci.find((s) => s.id === 'STU-102');
    expect(st102?.verificationMethod).toBe('biometric');
    expect(st102?.checkOutTime).toBe('15:45');
  });

  it('dispatches guardian absent SMS only when sendSms is enabled and filters invalid phone numbers', async () => {
    const spy = vi.spyOn(smsService, 'sendSMSBatch').mockResolvedValue({
      sentCount: 1,
      failedCount: 0,
      results: [],
    } as never);

    const absentees = [
      {
        id: 'STU-101',
        roll: '01',
        name: 'রাফি আহমেদ',
        grade: '6th',
        branch: 'A',
        guardian: 'করিম আহমেদ',
        mobile: '01711111111',
        status: 'Absent' as const,
      },
      {
        id: 'STU-BAD',
        roll: '09',
        name: 'নম্বরহীন',
        grade: '6th',
        branch: 'A',
        guardian: 'অভিভাবক',
        mobile: '123',
        status: 'Absent' as const,
      },
    ];

    const pushOnly = await attendanceService.dispatchAbsentAlerts({
      date: '2026-11-14',
      absentees,
      sendSms: false,
      sendPush: true,
      schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
    });
    expect(spy).not.toHaveBeenCalled();
    expect(pushOnly.smsSentCount).toBe(0);

    const withSms = await attendanceService.dispatchAbsentAlerts({
      date: '2026-11-14',
      absentees,
      sendSms: true,
      sendPush: true,
      schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(withSms.smsSentCount).toBe(1);
    expect(withSms.skippedNoPhone).toBe(1);
  });
});
