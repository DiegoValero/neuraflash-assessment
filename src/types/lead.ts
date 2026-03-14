import { AIAssertionResult } from './ai';

export type LeadStatus =
  | 'Open - Not Contacted'
  | 'Working - Contacted'
  | 'Closed - Converted'
  | 'Closed - Not Converted';

export interface LeadData {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
}

export interface LeadRecord extends LeadData {
  fullName: string;
}

export interface LeadCreationResult {
  success: boolean;
  leadData: LeadData;
  recordName: string;
  toastMessage: string;
  screenshotPath: string;
  timestamp: string;
  aiAssertion: AIAssertionResult;
}

export interface LeadStatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface LeadsExtractionResult {
  leads: LeadRecord[];
  totalCount: number;
  byStatus: LeadStatusCount[];
  timestamp: string;
}