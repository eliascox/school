import { describe, expect, it } from 'vitest';
import {
  VALID_FEE_SUB_TABS,
  buildFeeWorkspaceClusters,
  buildReportWorkspaceClusters,
  findActiveGroupedNavItem,
  isValidFeeSubTab,
} from '../src/lib/financeWorkspaceNavUtils';

describe('financeWorkspaceNavUtils — Grouped Executive Finance Navigation', () => {
  it('organizes all 8 Fee Collection sub-tabs into 3 logical clusters with live badges', () => {
    const clusters = buildFeeWorkspaceClusters({
      totalStudents: 90,
      dueStudentsCount: 42,
      invoicesCount: 15,
      receiptsCount: 8,
      feeSectorsCount: 6,
      openingDueAmount: 12500,
      auditLogsCount: 3,
    });

    expect(clusters).toHaveLength(3);
    expect(clusters.map((c) => c.id)).toEqual(['daily_desk', 'reports_audit', 'setup_config']);

    const allIds = clusters.flatMap((c) => c.items.map((i) => i.id));
    expect(allIds).toHaveLength(8);
    for (const id of VALID_FEE_SUB_TABS) {
      expect(allIds).toContain(id);
    }

    const dueItem = findActiveGroupedNavItem(clusters, 'due_report');
    expect(dueItem?.cluster.id).toBe('reports_audit');
    expect(dueItem?.item.badgeTone).toBe('alert');
    expect(dueItem?.item.badgeText).toBe('৪২');

    const setupItem = findActiveGroupedNavItem(clusters, 'fee_setup');
    expect(setupItem?.cluster.id).toBe('setup_config');
    expect(setupItem?.item.badgeText).toBe('৬ খাত');

    expect(isValidFeeSubTab('collection')).toBe(true);
    expect(isValidFeeSubTab('unknown_tab')).toBe(false);
  });

  it('organizes all 9 Financial Reports sub-tabs into 3 clean accounting clusters', () => {
    const clusters = buildReportWorkspaceClusters({
      vouchersCount: 24,
      accountsCount: 18,
      dueClassesWithDue: 5,
    });

    expect(clusters).toHaveLength(3);
    const allIds = clusters.flatMap((c) => c.items.map((i) => i.id));
    expect(allIds).toHaveLength(9);

    const voucherMeta = findActiveGroupedNavItem(clusters, 'vouchers');
    expect(voucherMeta?.cluster.id).toBe('ledgers_coa');
    expect(voucherMeta?.item.badgeText).toBe('২৪');
  });
});
