import { SuperAdminActionType, LicensePlan } from '@sms/shared-types';

export class ApprovalActionDto {
  action!: SuperAdminActionType;
  reason?: string;
  planType?: LicensePlan;
  validUntil?: string; // ISO 8601
  gracePeriodDays?: number;
  maxDevices?: number;
  maxStudents?: number;
}
