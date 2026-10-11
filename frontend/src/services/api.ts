const API_BASE = '/api/v1';

export class ApiError extends Error {
  errors: Record<string, string[]>;
  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.errors = errors;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const isFormData = options?.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    'Accept': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const { headers: customHeaders, ...rest } = options || {};

  const res = await fetch(`${API_BASE}${url}`, {
    ...rest,
    headers: {
      ...headers,
      ...(customHeaders || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Session expirée');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Erreur serveur' }));
    const msg = body.message || body.error || `Erreur ${res.status}`;
    throw new ApiError(msg, body.errors || {});
  }

  if (res.status === 204) return null as T;
  const json = await res.json();
  if (json && typeof json === 'object' && !Array.isArray(json) && Array.isArray(json.data) && Object.keys(json).length <= 3) {
    return json.data as T;
  }
  return json as T;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  created_at?: string;
}

export interface RhManager {
  id: number;
  matricule: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string | null;
  cin: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  photo: string | null;
  hire_date: string | null;
  contract_type: 'CDI' | 'CDD' | 'Stage';
  salary: number | null;
  status: boolean;
  department: { id: number; name: string; code: string } | null;
  contract: {
    id: number;
    employee_name: string;
    type: string;
    department: string | null;
    start_date: string | null;
    end_date: string | null;
    salary: number | null;
    status: string;
    trial_period: string | null;
    work_hours: string | null;
    leave_days: number | null;
    benefits: string | null;
    observations: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface RhManagerInput {
  first_name?: string;
  last_name?: string;
  gender?: 'male' | 'female';
  birth_date?: string | null;
  cin?: string | null;
  phone?: string | null;
  email?: string;
  address?: string | null;
  photo?: string | null;
  department_id?: number | null;
  hire_date?: string | null;
  contract_type?: 'CDI' | 'CDD' | 'Stage';
  salary?: number | null;
  status?: boolean;
  password?: string | null;
  password_confirmation?: string | null;
  contract_start_date?: string;
  contract_end_date?: string | null;
  trial_period?: string | null;
  work_hours?: string | null;
  leave_days?: number | null;
  benefits?: string | null;
  observations?: string | null;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  location: string | null;
  annual_budget: number | null;
  employees_count: number;
  status: boolean;
  rh_manager: {
    id: number;
    matricule: string;
    full_name: string;
    email: string;
    photo: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentInput {
  name?: string;
  code?: string;
  description?: string | null;
  rh_manager_id?: number | null;
  location?: string | null;
  annual_budget?: number | null;
  status?: boolean;
}

export interface Contract {
  id: number;
  employee_name: string;
  type: string;
  department: string;
  start_date: string | null;
  end_date: string | null;
  salary: string;
  status: 'active' | 'expired' | 'pending';
  trial_period: string | null;
  work_hours: string | null;
  leave_days: number | null;
  benefits: string | null;
  observations: string | null;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  kpis: {
    total_employees: number;
    total_rh_managers: number;
    total_departments: number;
    active_contracts: number;
    total_contracts: number;
    job_offers: number;
    published_offers: number;
    total_annonces: number;
    published_annonces: number;
    total_rh_active: number;
    total_rh_inactive: number;
    contracts_expired: number;
    recruitment_progress: number;
    growth_rate: number;
    total_applications: number;
    total_projects: number;
    active_projects: number;
    total_income: number;
    total_expense: number;
    net_profit: number;
  };
  financial: {
    revenue: number;
    expenses: number;
    profit: number;
    revenue_change: number;
    budget_used: number;
    budget_remaining: number;
  };
  revenue_vs_expenses: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  employee_growth: Array<{ month: string; employees: number }>;
  recruitment_trend: Array<{ month: string; applications: number; hired: number; conversion_rate: number }>;
  department_distribution: Array<{ name: string; value: number }>;
  contracts_status: Array<{ status: string; count: number }>;
  monthly_growth: Array<{ month: string; total: number; growth: number }>;
  projects: {
    total: number;
    by_status: Record<string, number>;
    total_budget: number;
    total_income: number;
    total_expenses: number;
    recent: Array<{ id: number; name: string; status: string; budget: number; result: number }>;
  };
  recruitments: {
    total: number;
    by_status: Record<string, number>;
    total_applications: number;
    total_positions: number;
    recent: Array<{ id: number; title: string; status: string; applications_count: number; department: string | null }>;
  };
  meetings: {
    total: number;
    upcoming: number;
    completed: number;
    total_participants: number;
  };
}

export type ContractInput = Partial<Omit<Contract, 'id' | 'created_at' | 'updated_at'>>;

export interface Recruitment {
  id: number;
  title: string;
  department: { id: number; name: string; code: string } | null;
  rh_manager: { id: number; full_name: string; matricule: string; email: string } | null;
  department_id: number | null;
  rh_manager_id: number | null;
  contract_type: string;
  location: string | null;
  work_mode: 'presentiel' | 'hybride' | 'teletravail';
  positions_count: number;
  experience_level: string | null;
  education_level: string | null;
  salary: number | null;
  posted_date: string | null;
  deadline: string | null;
  status: 'draft' | 'published' | 'closed' | 'archived';
  description: string | null;
  missions: string | null;
  skills: string | null;
  qualifications: string | null;
  benefits: string | null;
  additional_info: string | null;
  applications_count: number;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentStats {
  total: number;
  published: number;
  draft: number;
  closed: number;
  archived: number;
  total_applications: number;
}

export type RecruitmentInput = Partial<Omit<Recruitment, 'id' | 'created_at' | 'updated_at' | 'department' | 'rh_manager' | 'applications_count'>>;

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CandidateProfile {
  id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  education_level: string | null;
  experience_level: string | null;
  skills: string | null;
  languages: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  photo: string | null;
}

export interface CandidateDocument {
  id: number;
  category: 'cv' | 'cover_letter';
  category_label: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  file_size_formatted: string;
  url: string;
  created_at: string;
}

export type CandidateDocumentCategory = 'cv' | 'cover_letter';

export interface CandidateApplication {
  id: number;
  status: string;
  status_label: string;
  created_at: string;
  recruitment: {
    id: number;
    title: string;
    contract_type: string;
    location: string | null;
    department: string | null;
  };
}

export interface CandidateDashboard {
  total_applications: number;
  pending: number;
  accepted: number;
  rejected: number;
  recent_applications: CandidateApplication[];
}

export interface Meeting {
  id: number;
  title: string;
  description: string | null;
  type: 'regular' | 'weekly' | 'monthly' | 'special' | 'training' | 'evaluation';
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_link: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  minutes_summary: string | null;
  minutes_objective: string | null;
  minutes_key_points: string | null;
  minutes_notes: string | null;
  department: { id: number; name: string; code: string } | null;
  rh_manager: { id: number; full_name: string; matricule: string; email: string } | null;
  participants: MeetingParticipant[];
  decisions: MeetingDecision[];
  tasks: MeetingTask[];
  attachments: MeetingAttachment[];
  participants_count: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: number;
  full_name: string;
  matricule: string;
  email: string;
  pivot_status: string;
}

export interface MeetingDecision {
  id: number;
  title: string;
  description: string | null;
}

export interface MeetingTask {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignee: { id: number; full_name: string; matricule: string } | null;
}

export interface MeetingAttachment {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
}

export interface MeetingInput {
  title?: string;
  description?: string | null;
  type?: string;
  department_id?: number | null;
  rh_manager_id?: number | null;
  date?: string;
  start_time?: string;
  end_time?: string;
  location?: string | null;
  meeting_link?: string | null;
  priority?: string;
  status?: string;
  participants?: number[];
  minutes_summary?: string | null;
  minutes_objective?: string | null;
  minutes_key_points?: string | null;
  minutes_notes?: string | null;
}

export interface MeetingStats {
  total: number;
  today: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export interface Employee {
  id: number;
  matricule: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string | null;
  cin: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  photo: string | null;
  department_id: number;
  department: { id: number; name: string; code: string } | null;
  position: string | null;
  hire_date: string | null;
  contract_type: string;
  salary: number | null;
  status: boolean;
  has_user_account: boolean;
  created_at: string;
  updated_at: string;
}

export type EmployeeInput = Partial<Omit<Employee, 'id' | 'matricule' | 'created_at' | 'updated_at' | 'department' | 'has_user_account'>>;

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  male: number;
  female: number;
}

export type CandidateStatus = 'new' | 'cv_review' | 'interview_scheduled' | 'technical_test' | 'final_interview' | 'accepted' | 'rejected';

export interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  cin: string | null;
  birth_date: string | null;
  gender: 'male' | 'female';
  address: string | null;
  photo: string | null;
  recruitment_id: number;
  recruitment: { id: number; title: string; contract_type: string } | null;
  department_id: number;
  department: { id: number; name: string } | null;
  cover_letter: string | null;
  cv_file: string | null;
  status: CandidateStatus;
  status_label: string;
  notes: string | null;
  interview_date: string | null;
  interview_time: string | null;
  interview_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CandidateInput = Partial<Omit<Candidate, 'id' | 'created_at' | 'updated_at' | 'recruitment' | 'department' | 'full_name' | 'status_label'>>;

export interface RecruitmentAnnouncement {
  id: number;
  title: string;
  description: string | null;
  department_id: number;
  department: { id: number; name: string } | null;
  rh_manager_id: number | null;
  rh_manager: { id: number; name: string } | null;
  positions_count: number;
  contract_type: string;
  location: string | null;
  work_mode: string | null;
  salary: number | null;
  posted_date: string | null;
  deadline: string | null;
  status: 'draft' | 'published' | 'closed' | 'archived';
  missions: string | null;
  skills: string | null;
  qualifications: string | null;
  benefits: string | null;
  pending_candidates_count: number;
  total_candidates_count: number;
  created_at: string;
  updated_at: string;
}

export interface CandidateStats {
  total: number;
  new: number;
  cv_review: number;
  interview_scheduled: number;
  technical_test: number;
  final_interview: number;
  accepted: number;
  rejected: number;
}

export type DocumentCategory = 'cv' | 'diploma' | 'attestation' | 'medical' | 'contract';

export interface EmployeeDocument {
  id: number;
  employee_id: number;
  category: DocumentCategory;
  category_label: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  file_size_formatted: string;
  uploaded_by: { id: number; name: string } | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentCategoryCounts {
  cv: number;
  diploma: number;
  attestation: number;
  medical: number;
  contract: number;
}

export type CalendarEventType = 'interview' | 'meeting' | 'contract' | 'trial';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string;
  time: string | null;
  end_time: string | null;
  title: string;
  subtitle: string;
  status: string;
  color: string;
  data: Record<string, any>;
}

export interface CalendarNotification {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  date: string;
  time?: string;
  days_remaining?: number;
}

// ── API Client ─────────────────────────────────────────────────────────────

export interface FinanceDashboard {
  total_projects: number;
  total_budget: number;
  total_incomes: number;
  total_expenses: number;
  total_result: number;
  total_profit: number;
  total_loss: number;
  remaining_budget: number;
  profitable_projects: number;
  loss_projects: number;
}

export interface Project {
  id: number;
  name: string;
  client: string;
  description: string | null;
  budget: number;
  start_date: string;
  end_date: string | null;
  manager: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  total_incomes: number;
  total_expenses: number;
  result: number;
  remaining_budget: number;
  profitability_rate: number;
  incomes_count: number;
  expenses_count: number;
  incomes: ProjectIncome[];
  expenses: ProjectExpense[];
  created_at: string;
  updated_at: string;
}

export interface ProjectIncome {
  id: number;
  project_id: number;
  amount: number;
  date: string;
  payment_method: string;
  reference: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectExpense {
  id: number;
  project_id: number;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  receipt: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectInput = Partial<Omit<Project, 'id' | 'created_at' | 'updated_at' | 'total_incomes' | 'total_expenses' | 'result' | 'remaining_budget' | 'profitability_rate' | 'incomes_count' | 'expenses_count' | 'incomes' | 'expenses'>>;
export type ProjectIncomeInput = Partial<Omit<ProjectIncome, 'id' | 'created_at' | 'updated_at' | 'project_id'>>;
export type ProjectExpenseInput = Partial<Omit<ProjectExpense, 'id' | 'created_at' | 'updated_at' | 'project_id'>>;

export interface RhDashboardData {
  user: { id: number; name: string; email: string; role: string };
  rh_manager: { id: number; matricule: string; full_name: string; email: string };
  department: { id: number; name: string; code: string; location: string | null; employees_count: number; annual_budget: number | null };
  kpis: {
    total_employees: number;
    active_employees: number;
    active_contracts: number;
    recruitment_in_progress: number;
    meetings_today: number;
    pending_tasks: number;
  };
  recent_activities: Array<{ id: number; type: string; text: string; time: string }>;
}

export const api = {
  auth: {
    login: (email: string, password: string) => request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user: User; rh_manager?: any; candidate_profile?: CandidateProfile }>('/auth/me'),
    updateProfile: (data: { name: string; email: string }) => request<{ user: User; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updatePassword: (data: { current_password: string; password: string; password_confirmation: string }) => request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updateAvatar: (formData: FormData) => request<{ user: User; message: string }>('/auth/avatar', {
      method: 'POST',
      body: formData,
    }),
    resetPassword: (userId: number, data: { password: string; password_confirmation: string }) => request<{ message: string }>(`/auth/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    toggleAccountStatus: (userId: number) => request<{ message: string; is_active: boolean }>(`/auth/users/${userId}/toggle-status`, {
      method: 'PATCH',
    }),
    register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
      request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  },

  analytics: {
    getAll: (period: string = '12m') =>
      request<{ success: boolean; data: AnalyticsData }>(`/analytics?period=${period}`),
    getKPIs: (period: string = '12m') =>
      request<{ success: boolean; data: AnalyticsData['kpis'] }>(`/analytics/kpis?period=${period}`),
    getRevenueExpenses: (period: string = '12m') =>
      request<{ success: boolean; data: AnalyticsData['revenue_vs_expenses'] }>(`/analytics/revenue-expenses?period=${period}`),
    getFinancial: (period: string = '12m') =>
      request<{ success: boolean; data: AnalyticsData['financial'] }>(`/analytics/financial?period=${period}`),
  },

  rhDashboard: {
    getData: () => request<RhDashboardData>('/rh-dashboard'),
  },

  rhManagers: {
    list: () => request<RhManager[]>('/rh-managers'),
    get: (id: number) => request<RhManager>(`/rh-managers/${id}`),
    create: (data: RhManagerInput) => request<RhManager>('/rh-managers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: RhManagerInput) => request<RhManager>(`/rh-managers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<null>(`/rh-managers/${id}`, { method: 'DELETE' }),
    toggleStatus: (id: number) => request<RhManager>(`/rh-managers/${id}/toggle-status`, { method: 'PATCH' }),
    available: () => request<RhManager[]>('/rh-managers/available'),
  },

  departments: {
    list: () => request<Department[]>('/departments'),
    get: (id: number) => request<Department>(`/departments/${id}`),
    create: (data: DepartmentInput) => request<Department>('/departments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: DepartmentInput) => request<Department>(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<null>(`/departments/${id}`, { method: 'DELETE' }),
  },

  recruitments: {
    list: () => request<Recruitment[]>('/recruitments'),
    get: (id: number) => request<Recruitment>(`/recruitments/${id}`),
    create: (data: RecruitmentInput) => request<Recruitment>('/recruitments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: RecruitmentInput) => request<Recruitment>(`/recruitments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<null>(`/recruitments/${id}`, { method: 'DELETE' }),
    stats: () => request<RecruitmentStats>('/recruitments/stats'),
    publish: (id: number) => request<Recruitment>(`/recruitments/${id}/publish`, { method: 'PATCH' }),
    draft: (id: number) => request<Recruitment>(`/recruitments/${id}/draft`, { method: 'PATCH' }),
    close: (id: number) => request<Recruitment>(`/recruitments/${id}/close`, { method: 'PATCH' }),
    archive: (id: number) => request<Recruitment>(`/recruitments/${id}/archive`, { method: 'PATCH' }),
  },

  contracts: {
    list: () => request<Contract[]>('/contracts'),
    get: (id: number) => request<Contract>(`/contracts/${id}`),
    create: (data: ContractInput) => request<Contract>('/contracts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: ContractInput) => request<Contract>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<null>(`/contracts/${id}`, { method: 'DELETE' }),
    renew: (id: number) => request<Contract>(`/contracts/${id}/renew`, { method: 'PATCH' }),
    downloadPdf: (id: number) => `${API_BASE}/contracts/${id}/pdf/download`,
    previewPdf: (id: number) => `${API_BASE}/contracts/${id}/pdf`,
    regeneratePdf: (id: number) => request<{ pdf_path: string; pdf_url: string }>(`/contracts/${id}/pdf/regenerate`, { method: 'POST' }),
  },

  meetings: {
    list: (status?: string) => request<Meeting[]>(status && status !== 'all' ? `/meetings?status=${status}` : '/meetings'),
    get: (id: number) => request<Meeting>(`/meetings/${id}`),
    create: (data: MeetingInput) => request<Meeting>('/meetings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: MeetingInput) => request<Meeting>(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<null>(`/meetings/${id}`, { method: 'DELETE' }),
    updateStatus: (id: number, status: string) => request<Meeting>(`/meetings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    updateMinutes: (id: number, data: Pick<MeetingInput, 'minutes_summary' | 'minutes_objective' | 'minutes_key_points' | 'minutes_notes'>) =>
      request<Meeting>(`/meetings/${id}/minutes`, { method: 'PUT', body: JSON.stringify(data) }),
    upcoming: () => request<Meeting[]>('/meetings/upcoming'),
    calendar: (month?: number, year?: number) => {
      const params = month && year ? `?month=${month}&year=${year}` : '';
      return request<Meeting[]>(`/meetings/calendar${params}`);
    },
    stats: () => request<{ success: boolean; data: MeetingStats }>('/meetings/stats'),
    addDecision: (meetingId: number, data: { title: string; description?: string }) =>
      request<MeetingDecision>(`/meetings/${meetingId}/decisions`, { method: 'POST', body: JSON.stringify(data) }),
    deleteDecision: (meetingId: number, decisionId: number) =>
      request<null>(`/meetings/${meetingId}/decisions/${decisionId}`, { method: 'DELETE' }),
    addTask: (meetingId: number, data: Partial<MeetingTask>) =>
      request<MeetingTask>(`/meetings/${meetingId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
    updateTask: (taskId: number, data: Partial<MeetingTask>) =>
      request<MeetingTask>(`/meetings/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteTask: (taskId: number) =>
      request<null>(`/meetings/tasks/${taskId}`, { method: 'DELETE' }),
    addAttachment: (meetingId: number, data: { filename: string; original_name: string; mime_type: string; size: number }) =>
      request<MeetingAttachment>(`/meetings/${meetingId}/attachments`, { method: 'POST', body: JSON.stringify(data) }),
    deleteAttachment: (attachmentId: number) =>
      request<null>(`/meetings/attachments/${attachmentId}`, { method: 'DELETE' }),
  },

  finance: {
    dashboard: () => request<FinanceDashboard>('/finance/dashboard'),
    listProjects: () => request<Project[]>('/finance/projects'),
    getProject: (id: number) => request<Project>(`/finance/projects/${id}`),
    createProject: (data: ProjectInput) => request<Project>('/finance/projects', { method: 'POST', body: JSON.stringify(data) }),
    updateProject: (id: number, data: ProjectInput) => request<Project>(`/finance/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProject: (id: number) => request<null>(`/finance/projects/${id}`, { method: 'DELETE' }),
    addIncome: (projectId: number, data: ProjectIncomeInput) => request<ProjectIncome>(`/finance/projects/${projectId}/incomes`, { method: 'POST', body: JSON.stringify(data) }),
    deleteIncome: (incomeId: number) => request<null>(`/finance/incomes/${incomeId}`, { method: 'DELETE' }),
    addExpense: (projectId: number, data: ProjectExpenseInput) => request<ProjectExpense>(`/finance/projects/${projectId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
    deleteExpense: (expenseId: number) => request<null>(`/finance/expenses/${expenseId}`, { method: 'DELETE' }),
  },

  employees: {
    list: () => request<Employee[]>('/employees'),
    get: (id: number) => request<Employee>(`/employees/${id}`),
    create: (data: EmployeeInput) => request<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: EmployeeInput) => request<Employee>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<null>(`/employees/${id}`, { method: 'DELETE' }),
    toggleStatus: (id: number) => request<Employee>(`/employees/${id}/toggle-status`, { method: 'PATCH' }),
    resetPassword: (id: number) => request<{ message: string; password: string }>(`/employees/${id}/reset-password`, { method: 'POST' }),
    stats: () => request<EmployeeStats>('/employees/stats'),
    documents: {
      list: (employeeId: number, category?: string) => request<EmployeeDocument[]>(
        category && category !== 'all'
          ? `/employees/${employeeId}/documents?category=${category}`
          : `/employees/${employeeId}/documents`
      ),
      upload: (employeeId: number, formData: FormData) =>
        request<EmployeeDocument>(`/employees/${employeeId}/documents`, { method: 'POST', body: formData }),
      get: (docId: number) => request<EmployeeDocument>(`/employee-documents/${docId}`),
      replace: (docId: number, formData: FormData) =>
        request<EmployeeDocument>(`/employee-documents/${docId}/replace`, { method: 'PUT', body: formData }),
      delete: (docId: number) => request<null>(`/employee-documents/${docId}`, { method: 'DELETE' }),
      history: (employeeId: number) => request<any[]>(`/employees/${employeeId}/documents/history`),
      categoryCounts: (employeeId: number) => request<DocumentCategoryCounts>(`/employees/${employeeId}/documents/counts`),
    },
  },

  candidates: {
    announcements: () => request<RecruitmentAnnouncement[]>('/recruitment/announcements'),
    announcement: (id: number) => request<RecruitmentAnnouncement>(`/recruitment/announcements/${id}`),
    byRecruitment: (recruitmentId: number, status?: string) => request<Candidate[]>(
      status && status !== 'all'
        ? `/recruitment/${recruitmentId}/candidates?status=${status}`
        : `/recruitment/${recruitmentId}/candidates`
    ),
    get: (id: number) => request<Candidate>(`/recruitment/candidates/${id}`),
    fullProfile: (id: number) => request<{ candidate: Candidate; profile: CandidateProfile | null; documents: CandidateDocument[] }>(`/recruitment/candidates/${id}/full-profile`),
    updateStatus: (id: number, data: { status: CandidateStatus; notes?: string; interview_date?: string; interview_time?: string; interview_notes?: string }) =>
      request<Candidate>(`/recruitment/candidates/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
    stats: () => request<CandidateStats>('/recruitment/stats'),
  },

  calendar: {
    events: (from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString();
      return request<CalendarEvent[]>(`/calendar/events${qs ? '?' + qs : ''}`);
    },
    notifications: () => request<CalendarNotification[]>('/calendar/notifications'),
  },

  candidate: {
    dashboard: () => request<CandidateDashboard>('/candidate/dashboard'),
    profile: {
      get: () => request<CandidateProfile | null>('/candidate/profile'),
      update: (data: Partial<CandidateProfile>) => request<CandidateProfile>('/candidate/profile', { method: 'PUT', body: JSON.stringify(data) }),
    },
    documents: {
      list: () => request<CandidateDocument[]>('/candidate/documents'),
      upload: (formData: FormData) =>
        request<CandidateDocument>('/candidate/documents', { method: 'POST', body: formData }),
      replace: (docId: number, formData: FormData) =>
        request<CandidateDocument>(`/candidate/documents/${docId}/replace`, { method: 'PUT', body: formData }),
      delete: (docId: number) => request<null>(`/candidate/documents/${docId}`, { method: 'DELETE' }),
      downloadUrl: (docId: number) => `/api/v1/candidate/documents/${docId}/download`,
    },
    announcements: {
      list: (params?: { search?: string; department?: string; contract_type?: string; location?: string; sort?: string; page?: number }) => {
        const qs = new URLSearchParams();
        if (params?.search) qs.set('search', params.search);
        if (params?.department) qs.set('department', params.department);
        if (params?.contract_type) qs.set('contract_type', params.contract_type);
        if (params?.location) qs.set('location', params.location);
        if (params?.sort) qs.set('sort', params.sort);
        if (params?.page) qs.set('page', String(params.page));
        const q = qs.toString();
        return request<PaginatedResponse<Recruitment>>(`/candidate/announcements${q ? '?' + q : ''}`);
      },
      get: (id: number) => request<Recruitment>(`/candidate/announcements/${id}`),
      apply: (id: number) => request<{ id: number; status: string; status_label: string }>(`/candidate/announcements/${id}/apply`, { method: 'POST' }),
    },
    applications: {
      list: () => request<CandidateApplication[]>('/candidate/applications'),
      history: () => request<CandidateApplication[]>('/candidate/applications/history'),
    },
    calendar: {
      events: () => request<CandidateCalendarEvent[]>('/candidate/calendar'),
    },
  },

  notifications: {
    list: (params?: { filter?: string; search?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.filter) qs.set('filter', params.filter);
      if (params?.search) qs.set('search', params.search);
      if (params?.page) qs.set('page', String(params.page));
      const q = qs.toString();
      return request<PaginatedResponse<NotificationItem>>(`/notifications${q ? '?' + q : ''}`);
    },
    recent: () => request<NotificationItem[]>('/notifications/recent'),
    unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
    markRead: (id: number) => request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<{ message: string; updated: number }>('/notifications/read-all', { method: 'PATCH' }),
    delete: (id: number) => request<null>(`/notifications/${id}`, { method: 'DELETE' }),
  },

  ai: {
    chat: (message: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []) =>
      request<AIResponse>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      }),
    formSuggestions: (module: string, context: Record<string, any>) =>
      request<{ suggestions: FormSuggestion[] }>('/ai/form-suggestions', {
        method: 'POST',
        body: JSON.stringify({ module, context }),
      }),
  },
};

export interface CandidateCalendarEvent {
  id: number;
  type: string;
  title: string;
  date: string;
  time: string | null;
  notes: string | null;
  status: string;
  status_label: string;
  department: string | null;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  role: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  link: string | null;
  is_read: boolean;
  time_ago: string;
  created_at: string;
  updated_at: string;
}

export interface AIResponse {
  content: string;
  type: 'text';
  data: any | null;
  tool_calls: any[] | null;
  requires_confirmation: boolean;
  confirmation_message: string | null;
  error?: boolean;
  code?: number;
}

export interface FormSuggestion {
  field: string;
  label: string;
  value: string;
}
