/**
 * API Types - Tipos das entidades e responses da API
 * Baseado nos endpoints do backend FastAPI
 */

// ============= Auth =============
export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  tenant_id: number;
}

// ============= Condominium =============
export interface CondominiumResponse {
  id: number;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface CondominiumCreate {
  name: string;
  address: string;
}

export interface CondominiumUpdate {
  name?: string;
  address?: string;
}

// ============= Assembly =============
export type AssemblyStatus = 'draft' | 'in_progress' | 'finished';

export interface AssemblyResponse {
  id: number;
  title: string;
  condominium_id: number;
  scheduled_date: string;
  status: AssemblyStatus;
  created_at: string;
  updated_at: string;
  condominium?: CondominiumResponse;
}

export interface AssemblyCreate {
  title: string;
  condominium_id: number;
  scheduled_date: string;
}

export interface AssemblyUpdate {
  title?: string;
  scheduled_date?: string;
}

// ============= Unit =============
export interface UnitResponse {
  id: number;
  condominium_id: number;
  unit_number: string;
  owner_name: string;
  created_at: string;
}

export interface UnitCreate {
  condominium_id: number;
  unit_number: string;
  owner_name: string;
}

// ============= QR Code =============
export type QRCodeStatus = 'available' | 'assigned' | 'used';

export interface QRCodeResponse {
  id: number;
  assembly_id: number;
  token: string;
  visual_number: string;
  status: QRCodeStatus;
  created_at: string;
  assigned_at?: string;
  used_at?: string;
}

export interface QRCodeGenerateRequest {
  assembly_id: number;
  quantity: number;
}

// ============= Agenda =============
export type AgendaStatus = 'draft' | 'open' | 'closed';

export interface AgendaOptionResponse {
  id: number;
  agenda_id: number;
  option_text: string;
  display_order: number;
}

export interface AgendaResponse {
  id: number;
  assembly_id: number;
  title: string;
  description?: string;
  status: AgendaStatus;
  display_order: number;
  created_at: string;
  options?: AgendaOptionResponse[];
}

export interface AgendaCreate {
  assembly_id: number;
  title: string;
  description?: string;
  display_order: number;
  options: Array<{ option_text: string; display_order: number }>;
}

// ============= Voting =============
export interface VotingSessionResponse {
  assembly: AssemblyResponse;
  agendas: AgendaResponse[];
  has_voted: boolean;
  qr_code_status: QRCodeStatus;
}

export interface VoteRequest {
  agenda_id: number;
  option_id: number;
}

// ============= Check-in =============
export interface AssignQRCodeRequest {
  token: string;
  unit_ids: number[];
  is_proxy: boolean;
}

export interface AttendanceItemResponse {
  qr_code_id: number;
  visual_number: string;
  units: UnitResponse[];
  is_proxy: boolean;
  assigned_at: string;
}

export interface AttendanceResponse {
  assembly_id: number;
  total_units: number;
  checked_in_units: number;
  quorum_percentage: number;
  attendance_list: AttendanceItemResponse[];
}

// ============= Vote Results =============
export interface VoteResultResponse {
  agenda_id: number;
  agenda_title: string;
  total_votes: number;
  pending_votes: number;
  results: Array<{
    option_id: number;
    option_text: string;
    vote_count: number;
    percentage: number;
  }>;
}

// ============= Pagination =============
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============= SSE Events =============
export interface SSEEvent {
  event: 'vote_update' | 'checkin_update' | 'agenda_update' | 'heartbeat';
  data: unknown;
}
