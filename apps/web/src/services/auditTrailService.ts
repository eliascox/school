export interface AuditLogItem {
  action: string;
  category?: string;
  details: string;
  performedBy: string;
  status?: string;
  targetId?: string;
  severity?: string;
  timestamp?: string;
}

export const auditTrailService = {
  addLog: (log: AuditLogItem) => {
    console.log('[AuditTrailLog]', log);
    if (typeof window !== 'undefined') {
      const existingRaw = localStorage.getItem('sms_audit_logs');
      const logs = existingRaw ? JSON.parse(existingRaw) : [];
      logs.push({
        action: log.action,
        category: log.category || 'Finance',
        details: log.details,
        performedBy: log.performedBy,
        status: log.status || 'Success',
        targetId: log.targetId || '',
        severity: log.severity || 'info',
        timestamp: log.timestamp || new Date().toISOString()
      });
      localStorage.setItem('sms_audit_logs', JSON.stringify(logs));
    }
  },
};
