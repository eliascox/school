import { SchoolRegistrationRequest } from '@sms/shared-types';

export class RegisterSchoolDto implements SchoolRegistrationRequest {
  schoolName!: string;
  schoolCode?: string;
  eiinNumber?: string;
  division!: string;
  district!: string;
  upazila!: string;
  address!: string;
  contactPhone!: string;
  contactEmail?: string;
  principalName!: string;
  principalPhone!: string;
  authorizedPerson!: string;
  studentCountEstimate?: number;
  teacherCountEstimate?: number;
  
  // Registering device info
  deviceFingerprint!: string;
  deviceName!: string;
  osInfo!: string;
  appVersion!: string;
}
