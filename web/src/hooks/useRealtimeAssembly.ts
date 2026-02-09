import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSSE } from './useSSE';

interface VoteUpdatePayload {
  agenda_id: number;
  votes_count: number;
}

interface CheckinUpdatePayload {
  units_present: number;
  fraction_present: number;
}

interface AgendaUpdatePayload {
  agenda_id: number;
  status: string;
}

export function useRealtimeAssembly(assemblyId: number) {
  const queryClient = useQueryClient();

  const handleEvent = useCallback(
    (payload: { event: string; data: unknown }) => {
      if (payload.event === 'vote_update') {
        const data = payload.data as VoteUpdatePayload;
        if (typeof data.agenda_id === 'number') {
          queryClient.invalidateQueries({ queryKey: ['operator', 'agenda-results', data.agenda_id] });
        }
      }

      if (payload.event === 'checkin_update') {
        const data = payload.data as CheckinUpdatePayload;
        if (typeof data.units_present === 'number' && typeof data.fraction_present === 'number') {
          queryClient.invalidateQueries({ queryKey: ['checkin', 'attendance', assemblyId] });
          queryClient.invalidateQueries({ queryKey: ['checkin', 'quorum', assemblyId] });
        }
      }

      if (payload.event === 'agenda_update') {
        const data = payload.data as AgendaUpdatePayload;
        if (typeof data.agenda_id === 'number' && typeof data.status === 'string') {
          queryClient.invalidateQueries({ queryKey: ['operator', 'agendas', assemblyId] });
          queryClient.invalidateQueries({ queryKey: ['operator', 'agenda-results', data.agenda_id] });
        }
      }
    },
    [assemblyId, queryClient]
  );

  const sse = useSSE({
    endpoint: `/api/v1/realtime/assemblies/${assemblyId}/stream`,
    enabled: Number.isFinite(assemblyId) && assemblyId > 0,
    onEvent: handleEvent,
    reconnectDelayMs: 3000,
  });

  return sse;
}
