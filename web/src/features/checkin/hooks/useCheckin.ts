import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, APIError } from '@/lib/api-client';
import { useAssemblyUnits } from '@/features/assemblies/hooks/useAssemblyUnits';

export interface AttendanceUnit {
  id: number;
  unit_number: string;
  owner_name: string;
  ideal_fraction: number;
  cpf_cnpj: string;
}

export interface AttendanceItem {
  assignment_id: number;
  qr_visual_number: number;
  is_proxy: boolean;
  units: AttendanceUnit[];
  owner_names: string[];
  total_fraction: number;
}

interface AttendanceListResponse {
  items: AttendanceItem[];
}

interface CheckinPayload {
  qr_token: string;
  unit_ids: number[];
  is_proxy: boolean;
}

interface QuorumResponse {
  total_units: number;
  units_present: number;
  fraction_present: number;
  quorum_reached: boolean;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const detail = (error.data as { detail?: string })?.detail;
    return detail || fallback;
  }
  return fallback;
}

export function useAttendanceList(assemblyId: number) {
  return useQuery({
    queryKey: ['checkin', 'attendance', assemblyId],
    queryFn: () =>
      api.get<AttendanceListResponse>(`/api/v1/checkin/assemblies/${assemblyId}/attendance`),
    enabled: Number.isFinite(assemblyId) && assemblyId > 0,
    refetchInterval: 5000,
  });
}

export function useQuorum(assemblyId: number) {
  return useQuery({
    queryKey: ['checkin', 'quorum', assemblyId],
    queryFn: () => api.get<QuorumResponse>(`/api/v1/voting/assemblies/${assemblyId}/quorum`),
    enabled: Number.isFinite(assemblyId) && assemblyId > 0,
    refetchInterval: 5000,
  });
}

export function useCheckinUnits(assemblyId: number) {
  return useAssemblyUnits(assemblyId);
}

export function useAssignQRCode(assemblyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CheckinPayload) =>
      api.post(`/api/v1/checkin/assemblies/${assemblyId}/checkin`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin', 'attendance', assemblyId] });
      queryClient.invalidateQueries({ queryKey: ['checkin', 'quorum', assemblyId] });
      queryClient.invalidateQueries({ queryKey: ['voting'] });
      toast.success('Check-in realizado com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao realizar check-in.'));
    },
  });
}

export function useSelectUnitsByOwner(assemblyId: number) {
  return useMutation({
    mutationFn: (payload: { owner_name: string; cpf_cnpj?: string }) =>
      api.post<number[]>(`/api/v1/checkin/assemblies/${assemblyId}/select-units-by-owner`, payload),
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao selecionar unidades por proprietario.'));
    },
  });
}

export function useUndoCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: number) => api.delete(`/api/v1/checkin/assignments/${assignmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin', 'attendance'] });
      queryClient.invalidateQueries({ queryKey: ['checkin', 'quorum'] });
      toast.success('Check-in desfeito com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao desfazer check-in.'));
    },
  });
}
