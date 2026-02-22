import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, APIError } from '@/lib/api-client';
import type { AgendaResponse, PaginatedResponse } from '@/types/api';

export interface AgendaCreatePayload {
  assembly_id: number;
  title: string;
  description?: string;
  display_order: number;
  options: Array<{
    option_text: string;
    display_order: number;
  }>;
}

export interface AgendaUpdatePayload {
  title?: string;
  description?: string;
  display_order?: number;
  options?: Array<{
    option_text: string;
    display_order: number;
  }>;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const detail = (error.data as { detail?: string })?.detail;
    return detail || fallback;
  }
  return fallback;
}

export function useAgendas(assemblyId: number, page = 1, pageSize = 100) {
  return useQuery({
    queryKey: ['agendas', { assemblyId, page, pageSize }],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AgendaResponse>>('/api/v1/agendas', {
        page,
        page_size: pageSize,
      });
      return {
        ...response,
        items: response.items
          .filter((agenda) => agenda.assembly_id === assemblyId)
          .sort((a, b) => a.display_order - b.display_order),
      };
    },
    enabled: Number.isFinite(assemblyId) && assemblyId > 0,
  });
}

export function useAgenda(agendaId: number) {
  return useQuery({
    queryKey: ['agendas', agendaId],
    queryFn: () => api.get<AgendaResponse>(`/api/v1/agendas/${agendaId}`),
    enabled: Number.isFinite(agendaId) && agendaId > 0,
  });
}

export function useCreateAgenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AgendaCreatePayload) => api.post<AgendaResponse>('/api/v1/agendas', payload),
    onSuccess: (agenda) => {
      queryClient.invalidateQueries({ queryKey: ['agendas'] });
      queryClient.invalidateQueries({ queryKey: ['operator', 'agendas', agenda.assembly_id] });
      toast.success('Pauta criada com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao criar pauta.'));
    },
  });
}

export function useUpdateAgenda(agendaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AgendaUpdatePayload) =>
      api.put<AgendaResponse>(`/api/v1/agendas/${agendaId}`, payload),
    onSuccess: (agenda) => {
      queryClient.invalidateQueries({ queryKey: ['agendas'] });
      queryClient.invalidateQueries({ queryKey: ['agendas', agendaId] });
      queryClient.invalidateQueries({ queryKey: ['operator', 'agendas', agenda.assembly_id] });
      toast.success('Pauta atualizada com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao atualizar pauta.'));
    },
  });
}

export function useDeleteAgenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agendaId: number) => api.delete(`/api/v1/agendas/${agendaId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendas'] });
      queryClient.invalidateQueries({ queryKey: ['operator', 'agendas'] });
      toast.success('Pauta cancelada com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao cancelar pauta.'));
    },
  });
}
