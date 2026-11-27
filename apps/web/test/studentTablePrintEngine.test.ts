import { beforeEach, describe, expect, it } from 'vitest';
import {
  BUILT_IN_TABLE_PRESETS,
  DEFAULT_COLUMN_ORDER,
  DEFAULT_TABLE_STYLE,
  buildActiveColumnsMap,
  buildOrderedStudentCsvContent,
  buildOrderedStudentExcelRows,
  buildSampleMultiPageStudents,
  createCustomBlankColumn,
  deleteCustomTableTemplate,
  loadSavedTableTemplates,
  moveColumnByDelta,
  reorderColumnOrder,
  resolveVisibleOrderedColumns,
  saveCustomTableTemplate,
} from '../src/lib/studentTablePrintEngine';

const storageMap = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => (storageMap.has(k) ? storageMap.get(k)! : null),
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
    clear: () => storageMap.clear(),
  },
  configurable: true,
});
Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true });

describe('studentTablePrintEngine — Continuous Print, Column Reorder, Signature & Custom Columns', () => {
  beforeEach(() => {
    storageMap.clear();
  });

  it('reorders columns via drag-and-drop and up/down delta cleanly among active columns', () => {
    const base = ['sl', 'roll', 'id', 'name', 'mobile', 'signature'];
    const dragged = reorderColumnOrder(base, 'mobile', 'roll');
    expect(dragged).toEqual(['sl', 'mobile', 'roll', 'id', 'name', 'signature']);

    // Move 'mobile' down among active-only columns (skipping hidden 'id')
    const active = { sl: true, roll: true, id: false, name: true, mobile: true, signature: true };
    const shifted = moveColumnByDelta(base, 'name', -1, active);
    // 'id' is inactive, so 'name' jumps directly ahead of 'roll'!
    expect(shifted.indexOf('name')).toBeLessThan(shifted.indexOf('roll'));
  });

  it('supports adding custom blank columns, dedicated signature column width & ordered Excel/CSV export', () => {
    const customCol = createCustomBlankColumn({
      labelBn: 'বই গ্রহণ',
      labelEn: 'Book Received',
      width: 'wide',
    });
    const order = ['sl', 'roll', 'name', customCol.id, 'signature'];
    const active = buildActiveColumnsMap(['sl', 'roll', 'name', customCol.id, 'signature']);

    const resolved = resolveVisibleOrderedColumns({
      columnOrder: order,
      activeColumns: active,
      customColumns: [customCol],
      signatureColWidth: 'wide',
    });

    expect(resolved.map((c) => c.key)).toEqual(['sl', 'roll', 'name', customCol.id, 'signature']);
    expect(resolved[3].isCustom).toBe(true);
    expect(resolved[4].isSignature).toBe(true);
    expect(resolved[4].widthCss).toBe('162px');

    const sample = buildSampleMultiPageStudents(3);
    const excelBn = buildOrderedStudentExcelRows(sample, resolved, 'bn');
    expect(Object.keys(excelBn[0])).toEqual(['ক্র.', 'রোল', 'শিক্ষার্থীর নাম', 'বই গ্রহণ', 'স্বাক্ষর']);

    const excelEn = buildOrderedStudentExcelRows(sample, resolved, 'en');
    expect(Object.keys(excelEn[0])).toEqual(['SL', 'Roll', "Student's Name", 'Book Received', 'Signature']);

    const csv = buildOrderedStudentCsvContent(sample, resolved, 'en');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.replace(/^\uFEFF/, '').split('\n')[0]).toBe(
      '"SL","Roll","Student\'s Name","Book Received","Signature"',
    );
  });

  it('saves, loads, and deletes reusable custom table templates in localStorage', () => {
    const preset = BUILT_IN_TABLE_PRESETS.attendance_sign;
    const saved = saveCustomTableTemplate({
      name: 'বই বিতরণ স্বাক্ষর শিট',
      orientation: preset.orientation,
      margin: 'normal',
      docLang: 'bn',
      columnOrder: DEFAULT_COLUMN_ORDER,
      activeColumns: buildActiveColumnsMap(preset.activeKeys),
      customColumns: [],
      style: DEFAULT_TABLE_STYLE,
    });

    expect(saved).toHaveLength(1);
    const reloaded = loadSavedTableTemplates();
    expect(reloaded[0].name).toBe('বই বিতরণ স্বাক্ষর শিট');

    const afterDelete = deleteCustomTableTemplate(saved[0].id);
    expect(afterDelete).toHaveLength(0);
  });
});
