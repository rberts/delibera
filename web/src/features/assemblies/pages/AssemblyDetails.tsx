import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssemblyStatusBadge } from '../components/AssemblyStatusBadge';
import { useAssembly, useFinishAssembly, useStartAssembly } from '../hooks/useAssemblies';

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

function assemblyTypeLabel(type: string) {
  return type === 'ordinary' ? 'Ordinaria' : 'Extraordinaria';
}

export default function AssemblyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const assemblyId = Number(id);
  const { data: assembly, isLoading, error } = useAssembly(assemblyId);

  const startMutation = useStartAssembly();
  const finishMutation = useFinishAssembly();

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
        </TabsContent>

        <TabsContent value="agendas" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Integracao de pautas sera adicionada na Fase 8.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Importacao e gestao de unidades sera integrada no check-in.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
