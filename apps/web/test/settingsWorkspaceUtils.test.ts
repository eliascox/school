import { describe, expect, it } from 'vitest';
import {
  ALL_SETTINGS_NAV_ITEMS,
  computeSettingsChecklist,
  hasUnsavedSettingsDiff,
  searchSettingsItems,
  SETTINGS_CATEGORY_GROUPS,
  SettingsDirtySnapshot,
  TABS_WITH_MARKSHEET_PREVIEW,
} from '@/lib/settingsWorkspaceUtils';
import type { SchoolSettings } from '@/services/settingsService';

function makeSettings(overrides: Partial<SchoolSettings> = {}): SchoolSettings {
  return {
    schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
    schoolLogo: 'data:image/png;base64,abc',
    address: 'বরইতলী, চকরিয়া, কক্সবাজার',
    eiin: '106184',
    estdYear: '1969',
    principalName: 'মোহাম্মদ রফিকুল ইসলাম',
    principalTitle: 'প্রধান শিক্ষক',
    classTeacherTitle: 'শ্রেণি শিক্ষকের স্বাক্ষর',
    guardianTitle: 'অভিভাবকের স্বাক্ষর',
    showWatermark: true,
    watermarkText: '',
    watermarkOpacity: 0.03,
    phone: '01819000000',
    email: 'school@example.com',
    website: 'www.school.edu.bd',
    showClassSelection: true,
    showSectionSelection: true,
    showRollInput: true,
    uploadedPadTemplateUrl: 'data:image/jpeg;base64,pad',
    ...overrides,
  };
}

describe('settingsWorkspaceUtils', () => {
  it('organizes settings into 4 clean categories with 10 Bangla items and subtitles', () => {
    expect(SETTINGS_CATEGORY_GROUPS).toHaveLength(4);
    expect(ALL_SETTINGS_NAV_ITEMS).toHaveLength(10);
    for (const item of ALL_SETTINGS_NAV_ITEMS) {
      expect(item.labelBn.trim().length).toBeGreaterThan(0);
      expect(item.descBn.trim().length).toBeGreaterThan(0);
    }
    expect(TABS_WITH_MARKSHEET_PREVIEW.has('identity')).toBe(true);
    expect(TABS_WITH_MARKSHEET_PREVIEW.has('appearance')).toBe(true);
    expect(TABS_WITH_MARKSHEET_PREVIEW.has('academic')).toBe(true);
    expect(TABS_WITH_MARKSHEET_PREVIEW.has('pad')).toBe(false);
    expect(TABS_WITH_MARKSHEET_PREVIEW.has('data')).toBe(false);
  });

  it('finds target sections from Bangla and English quick-search queries', () => {
    expect(searchSettingsItems('')).toEqual([]);
    expect(searchSettingsItems('   ')).toEqual([]);

    const logoHit = searchSettingsItems('লোগো');
    expect(logoHit.some((i) => i.tab === 'appearance' && i.anchorId === 'section-logo')).toBe(true);

    const padHit = searchSettingsItems('প্যাড');
    expect(padHit.some((i) => i.tab === 'pad')).toBe(true);

    const passHit = searchSettingsItems('পাসওয়ার্ড');
    expect(passHit.some((i) => i.tab === 'security')).toBe(true);

    const backupHit = searchSettingsItems('ব্যাকআপ');
    expect(backupHit.some((i) => i.tab === 'data' && i.anchorId === 'section-backup')).toBe(true);

    const sessionHit = searchSettingsItems('সেশন');
    expect(sessionHit.some((i) => i.tab === 'academic')).toBe(true);

    const committeeHit = searchSettingsItems('কমিটি');
    expect(committeeHit.some((i) => i.tab === 'committee')).toBe(true);

    const smsHit = searchSettingsItems('SMS');
    expect(smsHit.some((i) => i.tab === 'sms')).toBe(true);

    const resetHit = searchSettingsItems('রিসেট');
    expect(resetHit.some((i) => i.tab === 'system' && i.anchorId === 'section-system-danger')).toBe(true);

    const englishHit = searchSettingsItems('principalNameEn');
    expect(englishHit.some((i) => i.tab === 'identity' && i.anchorId === 'field-principalName')).toBe(true);
  });

  it('computes setup checklist progress and auto-hides when all 5 core fields are set', () => {
    const empty = computeSettingsChecklist({});
    expect(empty.completedCount).toBe(0);
    expect(empty.totalCount).toBe(5);
    expect(empty.percent).toBe(0);
    expect(empty.isComplete).toBe(false);
    expect(empty.missingItems).toHaveLength(5);

    const partial = computeSettingsChecklist(
      makeSettings({ schoolLogo: '', uploadedPadTemplateUrl: '' }),
    );
    expect(partial.completedCount).toBe(3);
    expect(partial.percent).toBe(60);
    expect(partial.isComplete).toBe(false);
    expect(partial.missingItems.map((m) => m.id)).toEqual(['schoolLogo', 'uploadedPadTemplateUrl']);

    const full = computeSettingsChecklist(makeSettings());
    expect(full.completedCount).toBe(5);
    expect(full.percent).toBe(100);
    expect(full.isComplete).toBe(true);
    expect(full.missingItems).toEqual([]);
  });

  it('detects unsaved changes accurately while ignoring timestamp metadata', () => {
    const base: SettingsDirtySnapshot = {
      formData: makeSettings(),
      adminPhoneInput: 'admin',
      adminPassInput: '',
      currentSession: '২০২৬',
      examNames: ['অর্ধ-বার্ষিক পরীক্ষা', 'বার্ষিক পরীক্ষা'],
    };

    expect(hasUnsavedSettingsDiff(base, null)).toBe(false);
    expect(hasUnsavedSettingsDiff({ ...base }, base)).toBe(false);

    // Timestamp-only updates should not mark dirty
    const withUpdatedTimestamp: SettingsDirtySnapshot = {
      ...base,
      formData: {
        ...base.formData,
        uploadedPadUpdatedAt: 1700000000000,
      },
    };
    expect(hasUnsavedSettingsDiff(withUpdatedTimestamp, base)).toBe(false);

    // Actual edits should mark dirty
    expect(
      hasUnsavedSettingsDiff(
        { ...base, formData: { ...base.formData, schoolName: 'নতুন স্কুল' } },
        base,
      ),
    ).toBe(true);
    expect(hasUnsavedSettingsDiff({ ...base, currentSession: '২০২৭' }, base)).toBe(true);
    expect(hasUnsavedSettingsDiff({ ...base, adminPassInput: 'NewSecret123!' }, base)).toBe(true);
  });
});
