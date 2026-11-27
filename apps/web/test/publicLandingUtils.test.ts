import { describe, it, expect } from 'vitest';
import {
  PUBLIC_ACADEMIC_ITEMS,
  DEFAULT_PUBLIC_NOTICES,
  DEFAULT_PUBLIC_SERVICE_CARDS,
  resolvePublicHref,
  sanitizePublicImageUrl,
  resolvePublicNotices,
  resolvePublicServices,
  resolvePublicContactInfo,
  getGalleryCategories,
  filterGalleryItems,
  findSubmittedAdmissionApplications,
} from '../src/lib/publicLandingUtils';
import type { Notice } from '../src/services/noticeService';
import type { OnlineApplicationRecord } from '../src/lib/admissionUtils';
import type { GalleryMediaItem } from '../src/services/landingPageService';

describe('publicLandingUtils', () => {
  it('resolves anchor hrefs route-aware and repairs legacy hash routes', () => {
    expect(resolvePublicHref('#about', '/')).toBe('#about');
    expect(resolvePublicHref('#about', '/admission')).toBe('/#about');
    expect(resolvePublicHref('#notices', '/result')).toBe('/#notices');
    expect(resolvePublicHref('#/admission', '/')).toBe('/admission');
    expect(resolvePublicHref('#/login', '/')).toBe('/login');
    expect(resolvePublicHref('/dashboard/certificates', '/')).toBe('/verify-certificate');
    expect(resolvePublicHref('#', '/result')).toBe('/');
    expect(resolvePublicHref('#', '/')).toBe('#home');
  });

  it('keeps all academic dropdown targets valid section anchors', () => {
    const ids = PUBLIC_ACADEMIC_ITEMS.map((item) => item.sectionId);
    expect(ids).toEqual([
      'principal',
      'teachers',
      'academic',
      'student-stats',
      'best-students',
      'facilities',
      'committee',
    ]);
    PUBLIC_ACADEMIC_ITEMS.forEach((item) => {
      expect(item.href).toBe(`#${item.sectionId}`);
    });
  });

  it('sanitizes missing or ORB-blocked image URLs cleanly', () => {
    expect(sanitizePublicImageUrl('')).toBe('/school-campus.jpg');
    expect(sanitizePublicImageUrl(null)).toBe('/school-campus.jpg');
    expect(sanitizePublicImageUrl('undefined')).toBe('/school-campus.jpg');
    expect(
      sanitizePublicImageUrl(
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2000&q=85'
      )
    ).toBe('/school-campus.jpg');
    expect(sanitizePublicImageUrl('/custom-photo.png')).toBe('/custom-photo.png');
  });

  it('falls back to default notices when live notices are empty and prioritizes live notices when present', () => {
    const fallback = resolvePublicNotices([]);
    expect(fallback.length).toBe(DEFAULT_PUBLIC_NOTICES.length);
    expect(fallback[0].id).toBe('NTC-001');

    const live: Notice[] = [
      {
        id: 'N-LIVE-1',
        title: 'বার্ষিক পরীক্ষার বিশেষ বিজ্ঞপ্তি',
        content: 'সকল শিক্ষার্থীকে নির্ধারিত সময়ে উপস্থিত থাকতে হবে।',
        category: 'Exam',
        publishedAt: '2026-11-20T09:00:00.000Z',
        isPinned: true,
      } as unknown as Notice,
    ];
    const resolved = resolvePublicNotices(live);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe('N-LIVE-1');
    expect(resolved[0].category).toBe('পরীক্ষা');
    expect(resolved[0].isUrgent).toBe(true);
    expect(resolved[0].description).toContain('নির্ধারিত সময়ে');
  });

  it('resolves public service cards and sanitizes legacy admin certificate links', () => {
    const defaultCards = resolvePublicServices(undefined);
    expect(defaultCards.length).toBe(DEFAULT_PUBLIC_SERVICE_CARDS.length);
    expect(defaultCards.some((c) => c.href === '/verify-certificate')).toBe(true);
    expect(defaultCards.some((c) => c.href === '/login?role=teacher')).toBe(true);

    const customCards = resolvePublicServices({
      enabled: true,
      title: 'কাস্টম সেবা',
      subtitle: 'বর্ণনা',
      cards: [
        {
          id: 'custom-1',
          title: 'সনদ যাচাই',
          description: 'অনলাইন সনদ যাচাই করুন',
          icon: 'ShieldCheck',
          link: '/dashboard/certificates',
          badge: 'যাচাই',
          badgeColor: 'amber',
          visible: true,
        },
      ],
    });
    expect(customCards).toHaveLength(1);
    expect(customCards[0].href).toBe('/verify-certificate');
  });

  it('unifies contact info consistently and skips placeholder numbers', () => {
    const info = resolvePublicContactInfo(
      {
        schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
        address: 'বরইতলী, চকোরিয়া, কক্সবাজার',
        phone: '01766-XXXXXX',
        email: '',
        eiin: '106184',
      } as any,
      {
        enabled: true,
        title: 'যোগাযোগ',
        subtitle: '',
        address: 'বরইতলী, চকরিয়া',
        phone1: '+৮৮০১৭১২-৩৪৫৬৭৮',
        phone2: '+৮৮০১৮১৯-৮৭৬৫৪৩',
        email1: 'office@baraitolihs.edu.bd',
        email2: '',
        mapEmbedUrl: '',
        officeHours: 'রবিবার – বৃহস্পতিবার: সকাল ৯:০০ – বিকাল ৪:০০',
      },
      null
    );
    expect(info.address).toContain('চকরিয়া');
    expect(info.address).not.toContain('চকোরিয়া');
    expect(info.phone1).toBe('+৮৮০১৭১২-৩৪৫৬৭৮');
    expect(info.email1).toBe('office@baraitolihs.edu.bd');
    expect(info.eiin).toBe('১০৬১৮৪');
  });

  it('filters gallery categories cleanly', () => {
    const items: GalleryMediaItem[] = [
      { id: '1', type: 'image', title: 'A', category: 'অ্যাকাডেমিক', thumbnail: '/a.jpg', date: '', caption: '' },
      { id: '2', type: 'image', title: 'B', category: 'ক্রীড়া', thumbnail: '/b.jpg', date: '', caption: '' },
    ];
    expect(getGalleryCategories(items)).toEqual(['সকল', 'অ্যাকাডেমিক', 'ক্রীড়া']);
    expect(filterGalleryItems(items, 'সকল')).toHaveLength(2);
    expect(filterGalleryItems(items, 'ক্রীড়া')).toHaveLength(1);
  });

  it('tracks submitted admission applications by APP-ID or Bangla/English mobile digits', () => {
    const apps: OnlineApplicationRecord[] = [
      {
        appId: 'APP-2026-4455',
        name: 'মোঃ আরমান হোসেন',
        grade: '6th',
        mobile: '01812345678',
        birthRegNo: '20141512345678901',
        appliedAt: '2026-11-26T10:00:00.000Z',
      },
      {
        appId: 'APP-2026-8899',
        name: 'তানজিলা আক্তার',
        grade: '9th',
        mobile: '01799887766',
        appliedAt: '2026-11-27T11:00:00.000Z',
      },
    ];

    expect(findSubmittedAdmissionApplications(apps, 'app-2026-4455')).toHaveLength(1);
    expect(findSubmittedAdmissionApplications(apps, '০১৮১২৩৪৫৬৭৮')[0].appId).toBe('APP-2026-4455');
    expect(findSubmittedAdmissionApplications(apps, '01799887766')[0].name).toBe('তানজিলা আক্তার');
    expect(findSubmittedAdmissionApplications(apps, 'APP-9999')).toHaveLength(0);
  });
});
