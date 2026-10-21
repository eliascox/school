import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage and window for Node test environment
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = String(v);
  },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
};
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
}

import { landingPageService } from '../src/services/landingPageService';

describe('landingPageService CMS tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default config when storage is empty', () => {
    const config = landingPageService.getPublishedConfig();
    expect(config.header.schoolName).toBe('বরইতলী উচ্চ বিদ্যালয়');
    expect(config.sections.length).toBeGreaterThan(5);
    expect(config.theme.fontFamily).toBe('SolaimanLipi');
  });

  it('saves draft config and detects changes against published', () => {
    const draft = landingPageService.getDraftConfig();
    expect(landingPageService.hasDraftChanges()).toBe(false);

    draft.hero.title = 'নতুন স্কুল শিরোনাম ২০২৬';
    landingPageService.saveDraftConfig(draft, 'টেস্ট ইউজার');

    expect(landingPageService.hasDraftChanges()).toBe(true);
    expect(landingPageService.getDraftConfig().hero.title).toBe('নতুন স্কুল শিরোনাম ২০২৬');
    expect(landingPageService.getPublishedConfig().hero.title).toBe('বরইতলী উচ্চ বিদ্যালয়');
  });

  it('publishes draft and increments version snapshot', () => {
    const draft = landingPageService.getDraftConfig();
    draft.hero.badgeText = '🎉 নতুন সেশন ২০২৬';
    landingPageService.saveDraftConfig(draft);

    const published = landingPageService.publish('অ্যাডমিন', 'নতুন সেশন ব্যাজ পরিবর্তন');
    expect(published).toBe(true);

    const activeConfig = landingPageService.getPublishedConfig();
    expect(activeConfig.hero.badgeText).toBe('🎉 নতুন সেশন ২০২৬');
    expect(activeConfig.version).toBe(2);
    expect(landingPageService.hasDraftChanges()).toBe(false);

    const versions = landingPageService.getVersions();
    expect(versions.length).toBeGreaterThanOrEqual(1);
    expect(versions[0].summary).toContain('নতুন সেশন');
  });

  it('discards draft changes and resets to published', () => {
    const draft = landingPageService.getDraftConfig();
    draft.header.schoolName = 'পরিবর্তিত নাম';
    landingPageService.saveDraftConfig(draft);
    expect(landingPageService.hasDraftChanges()).toBe(true);

    landingPageService.discardDraft();
    expect(landingPageService.hasDraftChanges()).toBe(false);
    expect(landingPageService.getDraftConfig().header.schoolName).toBe('বরইতলী উচ্চ বিদ্যালয়');
  });

  it('toggles section visibility and reorders sections', () => {
    const initial = landingPageService.getDraftConfig();
    const statsSec = initial.sections.find(s => s.key === 'stats');
    expect(statsSec?.enabled).toBe(true);

    landingPageService.toggleSection(statsSec!.id, false);
    expect(landingPageService.getDraftConfig().sections.find(s => s.key === 'stats')?.enabled).toBe(false);

    // Reorder: Move second section to first
    const sec1 = initial.sections[0].id;
    const sec2 = initial.sections[1].id;
    landingPageService.reorderSections([sec2, sec1]);
    const reordered = landingPageService.getDraftConfig().sections;
    expect(reordered[0].id).toBe(sec2);
    expect(reordered[1].id).toBe(sec1);
  });

  it('restores previous version correctly', () => {
    // 1. Publish v2
    const d1 = landingPageService.getDraftConfig();
    d1.header.schoolSlogan = 'স্লোগান সংস্করণ ১';
    landingPageService.saveDraftConfig(d1);
    landingPageService.publish('অ্যাডমিন', 'প্রথম সংস্করণ');

    // 2. Publish v3
    const d2 = landingPageService.getDraftConfig();
    d2.header.schoolSlogan = 'স্লোগান সংস্করণ ২';
    landingPageService.saveDraftConfig(d2);
    landingPageService.publish('অ্যাডমিন', 'দ্বিতীয় সংস্করণ');

    const versions = landingPageService.getVersions();
    const v2Snapshot = versions.find(v => v.summary.includes('প্রথম'));
    expect(v2Snapshot).toBeDefined();

    // 3. Restore v2 into draft
    landingPageService.restoreVersion(v2Snapshot!.id);
    expect(landingPageService.getDraftConfig().header.schoolSlogan).toBe('স্লোগান সংস্করণ ১');
  });

  it('manages media library items and audit logs', () => {
    const item = landingPageService.addMediaItem({
      name: 'banner-test.jpg',
      url: 'data:image/jpeg;base64,123',
      size: 1024,
      type: 'image/jpeg',
      altText: 'টেস্ট ব্যানার',
      category: 'banner',
    });

    const mediaList = landingPageService.getMediaList();
    expect(mediaList.some(m => m.id === item.id)).toBe(true);

    const logs = landingPageService.getAuditLogs();
    expect(logs.some(l => l.action === 'UPLOAD_MEDIA')).toBe(true);

    landingPageService.deleteMediaItem(item.id);
    expect(landingPageService.getMediaList().some(m => m.id === item.id)).toBe(false);
  });
});
