import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgenda, useCreateAgenda, useUpdateAgenda } from '../hooks/useAgendas';

const agendaSchema = z.object({
  title: z.string().min(1, 'Titulo e obrigatorio').max(255),
  description: z.string().optional(),
  display_order: z.coerce.number().int().min(0, 'Ordem deve ser maior ou igual a 0'),
});

type AgendaFormData = z.infer<typeof agendaSchema>;

export default function AgendaForm() {
  const { id, agendaId } = useParams<{ id: string; agendaId: string }>();
  const navigate = useNavigate();

  const assemblyId = Number(id);
  const parsedAgendaId = Number(agendaId);
  const isEditing = Number.isFinite(parsedAgendaId) && parsedAgendaId > 0;

  const { data: agenda, isLoading: isLoadingAgenda } = useAgenda(parsedAgendaId);
  const createMutation = useCreateAgenda();
  const updateMutation = useUpdateAgenda(parsedAgendaId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgendaFormData>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      title: '',
      description: '',
      display_order: 0,
    },
  });

  useEffect(() => {
    if (!agenda) return;

    reset({
      title: agenda.title,
      description: agenda.description || '',
      display_order: agenda.display_order,
    });
  }, [agenda, reset]);

  const onSubmit = (data: AgendaFormData) => {
    const payload = {
      title: data.title,
      description: data.description?.trim() || undefined,
      display_order: data.display_order,
    };

    if (isEditing) {
      updateMutation.mutate(payload, {
        onSuccess: () => navigate(`/assemblies/${assemblyId}`),
      });
      return;
    }

    createMutation.mutate(
      {
        ...payload,
        assembly_id: assemblyId,
      },
      {
        onSuccess: () => navigate(`/assemblies/${assemblyId}`),
      }
    );
  };

  if (!Number.isFinite(assemblyId) || assemblyId <= 0) {
    return <p className="text-red-600">Assembleia invalida.</p>;
  }

  if (isEditing && isLoadingAgenda) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-[360px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate(`/assemblies/${assemblyId}`)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para assembleia
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? 'Editar pauta' : 'Nova pauta'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da pauta</CardTitle>
          <CardDescription>Configure titulo, descricao e ordem de exibicao.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" placeholder="Aprovacao de orcamento" {...register('title')} />
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea id="description" rows={4} placeholder="Detalhes da pauta" {...register('description')} />
              {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Ordem</Label>
              <Input id="display_order" type="number" min={0} step={1} {...register('display_order')} />
              {errors.display_order && <p className="text-sm text-red-600">{errors.display_order.message}</p>}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Salvar alteracoes' : 'Criar pauta'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/assemblies/${assemblyId}`)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
