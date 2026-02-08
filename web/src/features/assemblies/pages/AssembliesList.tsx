import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Play, Plus, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AssemblyStatusBadge } from '../components/AssemblyStatusBadge';
import {
  useAssemblies,
  useDeleteAssembly,
  useFinishAssembly,
  useStartAssembly,
} from '../hooks/useAssemblies';
import type { AssemblyStatus } from '@/types/api';

type UIStatusFilter = 'all' | AssemblyStatus;

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default function AssembliesList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<UIStatusFilter>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const apiStatus = statusFilter === 'cancelled' ? 'cancelled' : 'active';
  const { data, isLoading, error } = useAssemblies(page, 20, apiStatus);

  const deleteMutation = useDeleteAssembly();
  const startMutation = useStartAssembly();
  const finishMutation = useFinishAssembly();

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const rows = useMemo(() => {
    if (!data?.items) return [];
    if (statusFilter === 'all' || statusFilter === 'cancelled') return data.items;
    return data.items.filter((assembly) => assembly.status === statusFilter);
  }, [data?.items, statusFilter]);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSettled: () => setDeleteId(null),
    });
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Erro ao carregar assembleias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assembleias</h1>
          <p className="text-muted-foreground">Gerencie o ciclo das assembleias</p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as UIStatusFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="finished">Finalizada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Button asChild>
            <Link to="/assemblies/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Assembleia
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titulo</TableHead>
              <TableHead>Condominio</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[220px]">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-[220px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[110px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[200px]" /></TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma assembleia encontrada para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((assembly) => (
                <TableRow key={assembly.id}>
                  <TableCell className="font-medium">{assembly.title}</TableCell>
                  <TableCell>#{assembly.condominium_id}</TableCell>
                  <TableCell>{formatDate(assembly.assembly_date)}</TableCell>
                  <TableCell>
                    <AssemblyStatusBadge status={assembly.status} />
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex gap-1">
                        <ActionTooltip label="Ver detalhes">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/assemblies/${assembly.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </ActionTooltip>

                        <ActionTooltip label="Editar assembleia">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/assemblies/${assembly.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </ActionTooltip>

                        {assembly.status === 'draft' && (
                          <ActionTooltip label="Iniciar assembleia">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startMutation.mutate(assembly.id)}
                              disabled={startMutation.isPending}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </ActionTooltip>
                        )}

                        {assembly.status === 'in_progress' && (
                          <ActionTooltip label="Finalizar assembleia">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => finishMutation.mutate(assembly.id)}
                              disabled={finishMutation.isPending}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          </ActionTooltip>
                        )}

                        {assembly.status !== 'cancelled' && (
                          <ActionTooltip label="Cancelar assembleia">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(assembly.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ActionTooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total_pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {rows.length} de {data.total} assembleias
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= data.total_pages}
            >
              Proxima
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assembleia?</AlertDialogTitle>
            <AlertDialogDescription>
              A assembleia sera marcada como cancelada. Esta acao pode ser revertida apenas via API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {deleteMutation.isPending ? 'Cancelando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
