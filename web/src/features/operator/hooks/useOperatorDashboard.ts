import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, APIError } from '@/lib/api-client';
import type { AgendaStatus } from '@/types/api';

interface AgendaItem {
  id: number;
  assembly_id: number;
  title: string;
  description?: string;
  status: AgendaStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface AgendaListResponse {
  items: AgendaItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface OptionResult {
  option_id: number;
  option_text: string;
  votes_count: number;
  fraction_sum: number;
  percentage: number;
}

export interface AgendaResults {
  agenda_id: number;
  total_units_present: number;
  total_units_voted: number;
  total_fraction_present: number;
  total_fraction_voted: number;
  results: OptionResult[];
}

interface InvalidateVoteResponse {
  id: number;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const detail = (error.data as { detail?: string })?.detail;
    return detail || fallback;
  }
  return fallback;
}

export function useAssemblyAgendas(assemblyId: number) {
  return useQuery({
    queryKey: ['operator', 'agendas', assemblyId],
    queryFn: async () => {
      const response = await api.get<AgendaListResponse>('/api/v1/agendas', {
        page: 1,
        page_size: 100,
      });

      return response.items
        .filter((agenda) => agenda.assembly_id === assemblyId)
        .sort((a, b) => a.display_order - b.display_order);
    },
    enabled: Number.isFinite(assemblyId) && assemblyId > 0,
  });
}

export function useSetAgendaStatus(assemblyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agendaId, status }: { agendaId: number; status: AgendaStatus }) =>
      api.put(`/api/v1/agendas/${agendaId}`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['operator', 'agendas', assemblyId] });
      queryClient.invalidateQueries({ queryKey: ['operator', 'agenda-results', variables.agendaId] });
      toast.success('Status da pauta atualizado.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao atualizar status da pauta.'));
    },
  });
}

export function useAgendaResults(agendaId: number | null) {
  return useQuery({
    queryKey: ['operator', 'agenda-results', agendaId],
    queryFn: () => api.get<AgendaResults>(`/api/v1/voting/agendas/${agendaId}/results`),
    enabled: typeof agendaId === 'number' && agendaId > 0,
    refetchInterval: 5000,
  });
}

export function useInvalidateVote(assemblyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (voteId: number) =>
      api.post<InvalidateVoteResponse>(`/api/v1/voting/votes/${voteId}/invalidate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator', 'agendas', assemblyId] });
      queryClient.invalidateQueries({ queryKey: ['operator', 'agenda-results'] });
      toast.success('Voto invalidado com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao invalidar voto.'));
    },
  });
}
