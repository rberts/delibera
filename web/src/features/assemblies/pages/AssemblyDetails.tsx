import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Play, Plus, Square, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { APIError } from '@/lib/api-client';
import { AssemblyStatusBadge } from '../components/AssemblyStatusBadge';
import { useAssembly, useFinishAssembly, useStartAssembly } from '../hooks/useAssemblies';
import { useAssemblyUnits } from '../hooks/useAssemblyUnits';
import { useAgendas, useDeleteAgenda } from '@/features/agendas/hooks/useAgendas';
import { ReportDownload } from '@/features/reports/components/ReportDownload';
import { CSVImport } from '../components/CSVImport';

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

function assemblyTypeLabel(type: string) {
  return type === 'ordinary' ? 'Ordinaria' : 'Extraordinaria';
}

function agendaStatusLabel(status: string) {
  if (status === 'open') return 'Aberta';
  if (status === 'closed') return 'Fechada';
  if (status === 'cancelled') return 'Cancelada';
  return 'Rascunho';
}

function agendaStatusClass(status: string) {
  if (status === 'open') return 'bg-blue-100 text-blue-700';
  if (status === 'closed') return 'bg-green-100 text-green-700';
  if (status === 'cancelled') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

export default function AssemblyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const assemblyId = Number(id);
  const { data: assembly, isLoading, error } = useAssembly(assemblyId);
  const unitsQuery = useAssemblyUnits(assemblyId);
  const agendasQuery = useAgendas(assemblyId);
  const deleteAgendaMutation = useDeleteAgenda();

  const startMutation = useStartAssembly();
  const finishMutation = useFinishAssembly();

  useEffect(() => {
    if (!error) return;
    const message =
      error instanceof APIError
        ? ((error.data as { detail?: string })?.detail ?? 'Falha ao carregar assembleia.')
        : 'Falha ao carregar assembleia.';
    toast.error(message);
  }, [error]);

  useEffect(() => {
    if (!agendasQuery.error) return;
    const message =
      agendasQuery.error instanceof APIError
        ? ((agendasQuery.error.data as { detail?: string })?.detail ?? 'Falha ao carregar pautas.')
        : 'Falha ao carregar pautas.';
    toast.error(message);
  }, [agendasQuery.error]);

  useEffect(() => {
    if (!unitsQuery.error) return;
    const message =
      unitsQuery.error instanceof APIError
        ? ((unitsQuery.error.data as { detail?: string })?.detail ?? 'Falha ao carregar unidades importadas.')
        : 'Falha ao carregar unidades importadas.';
    toast.error(message);
  }, [unitsQuery.error]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[320px]" />
        <Skeleton className="h-[220px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (error || !assembly) {
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
          <Button variant="ghost" onClick={() => navigate('/assemblies')} className="mb-3">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para assembleias
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{assembly.title}</h1>
          <p className="text-muted-foreground mt-1">Condominio #{assembly.condominium_id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AssemblyStatusBadge status={assembly.status} />

          <Button asChild variant="outline">
            <Link to={`/assemblies/${assembly.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>

          {assembly.status === 'draft' && (
            <Button onClick={() => startMutation.mutate(assembly.id)} disabled={startMutation.isPending}>
              <Play className="mr-2 h-4 w-4" />
              Iniciar
            </Button>
          )}

          {assembly.status === 'in_progress' && (
            <Button onClick={() => finishMutation.mutate(assembly.id)} disabled={finishMutation.isPending}>
              <Square className="mr-2 h-4 w-4" />
              Finalizar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Data da assembleia</p>
            <p className="font-medium">{formatDate(assembly.assembly_date)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo</p>
            <p className="font-medium">{assemblyTypeLabel(assembly.assembly_type)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Local</p>
            <p className="font-medium">{assembly.location}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agendas">Agendas</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-muted-foreground">Acoes rapidas</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/assemblies/${assembly.id}/operate`}>Abrir dashboard do operador</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to={`/assemblies/${assembly.id}/checkin`}>Abrir check-in</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Relatorios</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportDownload
                  assemblyId={assembly.id}
                  agendas={agendasQuery.data?.items ?? []}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agendas" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">Gerencie as pautas desta assembleia.</p>
                <Button asChild size="sm">
                  <Link to={`/assemblies/${assembly.id}/agendas/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar pauta
                  </Link>
                </Button>
              </div>

              {agendasQuery.isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : (agendasQuery.data?.items.length || 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma pauta cadastrada.</p>
              ) : (
                <div className="space-y-3">
                  {agendasQuery.data?.items.map((agenda) => (
                    <div key={agenda.id} className="rounded-md border p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {agenda.display_order}. {agenda.title}
                        </p>
                        <Badge className={agendaStatusClass(agenda.status)}>
                          {agendaStatusLabel(agenda.status)}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {agenda.description || 'Sem descricao.'}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/assemblies/${assembly.id}/agendas/${agenda.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAgendaMutation.mutate(agenda.id)}
                          disabled={deleteAgendaMutation.isPending || agenda.status === 'cancelled'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancelar pauta
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="pt-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Importe as unidades desta assembleia via CSV para liberar check-in e votacao.
                  </p>
                  <CSVImport
                    assemblyId={assembly.id}
                    disabled={(unitsQuery.data?.total ?? 0) > 0}
                  />
                </div>
                {(unitsQuery.data?.total ?? 0) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Esta assembleia ja possui unidades importadas. Para manter o snapshot imutavel, nao e permitido reimportar.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unidades Importadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {unitsQuery.isLoading ? (
                  <Skeleton className="h-28 w-full" />
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">Total de unidades</p>
                        <p className="text-xl font-semibold">{unitsQuery.data?.total ?? 0}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">Soma da fracao ideal</p>
                        <p className="text-xl font-semibold">{(unitsQuery.data?.fraction_sum ?? 0).toFixed(2)}%</p>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Proprietario</TableHead>
                            <TableHead>Fracao</TableHead>
                            <TableHead>CPF/CNPJ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(unitsQuery.data?.items.length ?? 0) === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                Nenhuma unidade importada para esta assembleia.
                              </TableCell>
                            </TableRow>
                          ) : (
                            unitsQuery.data?.items.map((unit) => (
                              <TableRow key={unit.id}>
                                <TableCell>{unit.unit_number}</TableCell>
                                <TableCell>{unit.owner_name}</TableCell>
                                <TableCell>{unit.ideal_fraction.toFixed(2)}%</TableCell>
                                <TableCell>{unit.cpf_cnpj}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
