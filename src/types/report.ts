import { AIAssertionResult, ScenarioResult } from './ai';
import { LeadCreationResult, LeadsExtractionResult } from './lead';

export interface Task1Report {
  leadCreation: LeadCreationResult;
  leadsExtraction: LeadsExtractionResult;
  aiSummary: string;
  aiAssertionResult: AIAssertionResult;
  generatedAt: string;
}

export interface Task2Report {
  scenarios: ScenarioResult[];
  totalPassed: number;
  totalFailed: number;
  passRate: string;
  generatedAt: string;
}