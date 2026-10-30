import { CaseSummary, Clue, Hint, PublicCase, ResultData } from '../types/case';

const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE = rawBase
  ? rawBase.endsWith('/api')
    ? rawBase
    : `${rawBase.replace(/\/+$/, '')}/api`
  : '/api';

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const storedId = typeof localStorage !== 'undefined' ? localStorage.getItem('amr_investigator_id') : null;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(storedId ? { 'x-investigator-id': storedId } : {}),
      ...options.headers,
    },
  });

  const returnedId = res.headers.get('x-investigator-id');
  if (returnedId && typeof localStorage !== 'undefined') {
    localStorage.setItem('amr_investigator_id', returnedId);
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    const code = json.error?.code || 'NETWORK_ERROR';
    const message = json.error?.message || `HTTP ${res.status}: Failed request`;
    throw new ApiError(code, message);
  }

  return json.data as T;
}

export const api = {
  // Health check
  checkHealth: () => request<{ status: string; database: string }>('/health'),

  // Auth / Session
  getSession: async () => {
    const data = await request<{
      ownerId: string;
      badgeNumber: string;
      isGuest: boolean;
      status: string;
    }>('/auth/session');
    if (data?.ownerId && typeof localStorage !== 'undefined') {
      localStorage.setItem('amr_investigator_id', data.ownerId);
    }
    return data;
  },

  // Cases
  createCase: (data: {
    premise: string;
    difficulty: string;
    category?: string;
    caseLength?: string;
  }) => request<PublicCase>('/cases', { method: 'POST', body: JSON.stringify(data) }),

  getCase: (id: string) => request<PublicCase>(`/cases/${id}`),

  listMyCases: () => request<CaseSummary[]>('/cases'),

  discoverClue: (caseId: string, clueId: string) =>
    request<{ clue: Clue; caseState: PublicCase }>(`/cases/${caseId}/clues/${clueId}/discover`, {
      method: 'POST',
    }),

  requestHint: (caseId: string, idempotencyKey?: string) =>
    request<{ hint: Hint; caseState: PublicCase }>(`/cases/${caseId}/hints`, {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey }),
    }),

  saveNotes: (caseId: string, notes: string) =>
    request<{ notes: string }>(`/cases/${caseId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    }),

  submitAccusation: (caseId: string, suspectId: string, idempotencyKey?: string) =>
    request<ResultData>(`/cases/${caseId}/accuse`, {
      method: 'POST',
      body: JSON.stringify({ suspectId, idempotencyKey }),
    }),

  getResult: (caseId: string) => request<ResultData>(`/cases/${caseId}/result`),
};
