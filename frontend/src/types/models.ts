export interface User {
  id: number;
  name?: string;
  email?: string;
  picture?: string;
  locale?: 'ru' | 'en';
  is_anonymous?: boolean;
  feature_flags?: string[];
}

export interface BoardColumn {
  id: string;
  name?: string;
  color?: string;
  has_lanes?: boolean;
  is_base?: boolean;
  system_role?: string;
  role?: string;
}

export interface VacancyHistoryItem {
  id?: number | string;
  from_status?: string;
  to_status: string;
  from_lane?: number;
  to_lane?: number;
  comment?: string;
  created_at?: string;
}

export interface MatchedRequirement {
  requirement: string;
  requirementEn?: string;
  evidence?: string;
  evidenceEn?: string;
}

export interface MissingRequirement {
  requirement: string;
  requirementEn?: string;
  severity?: string;
  reason?: string;
  reasonEn?: string;
}

export interface CriticalGap {
  gap?: string;
  requirement?: string;
  requirementEn?: string;
  impact?: string;
  reason?: string;
  reasonEn?: string;
}

export interface CompatibilityRecommendation {
  text?: string;
  title?: string;
}

export interface CompatibilityAnalysis {
  status?: string;
  overall_score?: number;
  calculated_score?: number;
  summary?: string;
  is_outdated?: boolean;
  cv_revision?: number | string;
  seniority_assessment?: {
    status?: string;
    comment?: string;
  };
  matched_requirements?: MatchedRequirement[];
  missing_requirements?: MissingRequirement[];
  critical_gaps?: (CriticalGap | string)[];
  recommendations?: (CompatibilityRecommendation | string)[];
  recommendationsEn?: string[];
}

export interface Vacancy {
  id: number;
  title: string;
  company?: string;
  url?: string;
  location?: string;
  country?: string;
  city?: string;
  source?: string;
  status: string;
  lane?: number;
  sort_order?: number;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  workplace_type?: string;
  is_closed?: boolean;
  calculated_score?: number;
  match_score?: number;
  ai_summary?: string;
  company_info?: string;
  company_description?: string;
  description?: string;
  notes?: string;
  tech_stack?: string[];
  tags?: string[];
  created_at?: string;
  history?: VacancyHistoryItem[];
  history_count?: number;
  has_comment?: boolean;
}

export interface LandingVacancy extends Vacancy {
  ai_summary_en?: string;
  created_at_en?: string;
}

export interface QueueTask {
  id?: string | number;
  task_id: string | number;
  url: string;
  title?: string;
  company?: string;
  status: string;
  stage?: string;
}

export interface ApiKeyItem {
  id: number | string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
}
