import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { APIError } from '@/lib/api-client';
import { useAssembly } from '@/features/assemblies/hooks/useAssemblies';
import { useAttendanceList, useQuorum } from '@/features/checkin/hooks/useCheckin';
import { useRealtimeAssembly } from '@/hooks/useRealtimeAssembly';
import {
  useAgendaResults,
  useAssemblyAgendas,
  useInvalidateVote,
  useSetAgendaStatus,
} from '../hooks/useOperatorDashboard';
import { AgendaControl } from '../components/AgendaControl';
import { VoteMonitor } from '../components/VoteMonitor';
import { QuorumIndicator } from '../components/QuorumIndicator';
import { AttendancePanel } from '../components/AttendancePanel';

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

function connectionLabel(status: 'idle' | 'connecting' | 'open' | 'error') {
  if (status === 'open') return 'SSE online';
  if (status === 'connecting') return 'Conectando SSE';
  if (status === 'error') return 'SSE reconectando';
  return 'SSE inativo';
}

function connectionClassName(status: 'idle' | 'connecting' | 'open' | 'error') {
  if (status === 'open') return 'bg-green-100 text-green-700';
  if (status === 'error') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

export default function OperatorDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const assemblyId = Number(id);
  const { data: assembly, isLoading: isAssemblyLoading, error: assemblyError } = useAssembly(assemblyId);

  const agendasQuery = useAssemblyAgendas(assemblyId);
  const attendanceQuery = useAttendanceList(assemblyId);
  const quorumQuery = useQuorum(assemblyId);

  const realtime = useRealtimeAssembly(assemblyId);
  const setAgendaStatus = useSetAgendaStatus(assemblyId);
  const invalidateVote = useInvalidateVote(assemblyId);

  const openAgenda = useMemo(
    () => agendasQuery.data?.find((agenda) => agenda.status === 'open') ?? null,
    [agendasQuery.data]
  );

  const [selectedAgendaId, setSelectedAgendaId] = useState<number | null>(null);

  useEffect(() => {
    if (!agendasQuery.data || agendasQuery.data.length === 0) {
      setSelectedAgendaId(null);
      return;
    }

    const selectedExists = selectedAgendaId
      ? agendasQuery.data.some((agenda) => agenda.id === selectedAgendaId)
      : false;

    if (selectedExists) return;

    if (openAgenda) {
      setSelectedAgendaId(openAgenda.id);
      return;
    }

    setSelectedAgendaId(agendasQuery.data[0].id);
  }, [agendasQuery.data, openAgenda, selectedAgendaId]);

  const resultsQuery = useAgendaResults(selectedAgendaId);

  useEffect(() => {
    if (!assemblyError) return;
    const detail =
      assemblyError instanceof APIError
        ? ((assemblyError.data as { detail?: string })?.detail ?? 'Falha ao carregar assembleia.')
        : 'Falha ao carregar assembleia.';
    toast.error(detail);
  }, [assemblyError]);

  useEffect(() => {
    if (!agendasQuery.error) return;
    const detail =
      agendasQuery.error instanceof APIError
        ? ((agendasQuery.error.data as { detail?: string })?.detail ?? 'Falha ao carregar pautas.')
        : 'Falha ao carregar pautas.';
    toast.error(detail);
  }, [agendasQuery.error]);

  useEffect(() => {
    if (!resultsQuery.error) return;
    const detail =
      resultsQuery.error instanceof APIError
        ? ((resultsQuery.error.data as { detail?: string })?.detail ??
          'Falha ao carregar resultados da pauta.')
        : 'Falha ao carregar resultados da pauta.';
    toast.error(detail);
  }, [resultsQuery.error]);

  if (isAssemblyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[320px]" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (assemblyError || !assembly) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/assemblies')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para assembleias
        </Button>
        <p className="text-red-600">Assembleia nao encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" onClick={() => navigate(`/assemblies/${assembly.id}`)} className="mb-3">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para detalhes
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do operador</h1>
          <p className="text-muted-foreground mt-1">
            {assembly.title} - {formatDate(assembly.assembly_date)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={connectionClassName(realtime.status)}>{connectionLabel(realtime.status)}</Badge>
          <Button asChild variant="outline">
            <Link to={`/assemblies/${assembly.id}/checkin`}>Abrir check-in</Link>
          </Button>
        </div>
      </div>

      <QuorumIndicator quorum={quorumQuery.data} isLoading={quorumQuery.isLoading} />

      <Card>
        <CardHeader>
          <CardTitle>Operacao em tempo real</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="agenda-control" className="w-full">
            <TabsList>
              <TabsTrigger value="agenda-control">Agenda Control</TabsTrigger>
              <TabsTrigger value="vote-monitor">Vote Monitor</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>

            <TabsContent value="agenda-control" className="pt-4">
              <AgendaControl
                agendas={agendasQuery.data ?? []}
                isLoading={agendasQuery.isLoading}
                isSubmitting={setAgendaStatus.isPending}
                onOpenAgenda={(agendaId) => setAgendaStatus.mutate({ agendaId, status: 'open' })}
                onCloseAgenda={(agendaId) => setAgendaStatus.mutate({ agendaId, status: 'closed' })}
              />
            </TabsContent>

            <TabsContent value="vote-monitor" className="pt-4">
              <VoteMonitor
                agendas={agendasQuery.data ?? []}
                selectedAgendaId={selectedAgendaId}
                onSelectAgenda={(agendaId) => setSelectedAgendaId(agendaId)}
                results={resultsQuery.data}
                isLoadingResults={resultsQuery.isLoading}
                onInvalidateVote={(voteId) => invalidateVote.mutate(voteId)}
                isInvalidating={invalidateVote.isPending}
              />
            </TabsContent>

            <TabsContent value="attendance" className="pt-4">
              <AttendancePanel
                items={attendanceQuery.data?.items ?? []}
                isLoading={attendanceQuery.isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
