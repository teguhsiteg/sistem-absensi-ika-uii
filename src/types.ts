/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EventConfig {
  id: string;
  title: string;
  description: string;
  organizer: string;
  date: string;
  time: string;
  location: string;
  mapsUrl: string;
  bannerUrl: string;
  logoUrl: string;
  registrationDeadline: string;
  isActive: boolean;
  isScannerActive: boolean;
  isRegistrationActive: boolean;
  isArchived?: boolean;
  successMessage: string;
  scannerPin?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    website?: string;
    facebook?: string;
  };
  gallery?: string[];
  fullDescription?: string;
}

export type AttendanceStatus = 'Hadir' | 'Berhalangan';

export interface Participant {
  id: string; // E.g., IKA-0001
  eventId: string;
  name: string;
  phone: string;
  email?: string;
  status: AttendanceStatus;
  reason?: string;
  instansi?: string;
  jabatan?: string;
  kota?: string;
  catatan?: string;
  consent: boolean;
  subscribeNewsletter?: boolean;
  createdAt: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  ipAddress: string;
  userAgent: string;
}

export interface AuditLog {
  id: string;
  eventId: string;
  timestamp: string;
  adminUser: string;
  action: string;
  details: string;
}

export interface EventStats {
  totalRegistered: number;
  totalHadir: number;
  totalBelumHadir: number;
  totalBerhalangan: number;
  checkedInTodayCount: number;
  attendanceRate: number;
  hourlyCheckIn: { hour: string; count: number }[];
  instansiBreakdown: { name: string; value: number }[];
  angkatanBreakdown: { name: string; value: number }[];
  kotaBreakdown: { name: string; value: number }[];
  statusBreakdown: { name: string; value: number }[];
}
