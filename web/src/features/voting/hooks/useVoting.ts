import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, APIError } from '@/lib/api-client';
import type { AgendaResponse, AssemblyResponse } from '@/types/api';

interface VotingUnit {
  id: number;
  unit_number: string;
  owner_name: string;
}

interface VotingStatusResponse {
  assembly: AssemblyResponse;
  agenda: AgendaResponse | null;
  units: VotingUnit[];
  has_voted: boolean;
}

interface CastVotePayload {
  agenda_id: number;
  option_id: number;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const detail = (error.data as { detail?: string })?.detail;
    return detail || fallback;
  }
  return fallback;
}

export function useVoting(token: string) {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['voting', token],
    queryFn: () => api.get<VotingStatusResponse>(`/api/v1/voting/status/${token}`),
    enabled: Boolean(token),
    refetchInterval: 5000,
    retry: 1,
  });

  const voteMutation = useMutation({
    mutationFn: ({ agenda_id, option_id }: CastVotePayload) =>
      api.post('/api/v1/voting/vote', {
        qr_token: token,
        agenda_id,
        option_id,
      }),
    retry: 3,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voting', token] });
      toast.success('Voto registrado com sucesso!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao registrar voto.'));
    },
  });

  const submitVote = (optionId: number) => {
    const agendaId = statusQuery.data?.agenda?.id;
    if (!agendaId) {
      toast.error('Nenhuma pauta aberta para votação.');
      return;
    }

    voteMutation.mutate({ agenda_id: agendaId, option_id: optionId });
  };

  return {
    assembly: statusQuery.data?.assembly,
    agenda: statusQuery.data?.agenda ?? null,
    units: statusQuery.data?.units ?? [],
    hasVoted: statusQuery.data?.has_voted ?? false,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,
    submitVote,
    isSubmitting: voteMutation.isPending,
  };
}
