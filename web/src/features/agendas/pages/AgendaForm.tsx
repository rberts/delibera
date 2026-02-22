import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
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
  options: z
    .array(
      z.object({
        option_text: z.string().trim().min(1, 'Opcao e obrigatoria').max(255),
      })
    )
    .min(2, 'Informe ao menos 2 opcoes de voto'),
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
    control,
    formState: { errors },
  } = useForm<AgendaFormData>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      title: '',
      description: '',
      display_order: 0,
      options: [{ option_text: '' }, { option_text: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  useEffect(() => {
    if (!agenda) return;

    reset({
      title: agenda.title,
      description: agenda.description || '',
      display_order: agenda.display_order,
      options:
        agenda.options && agenda.options.length > 0
          ? agenda.options
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((option) => ({ option_text: option.option_text }))
          : [{ option_text: '' }, { option_text: '' }],
    });
  }, [agenda, reset]);

  const onSubmit = (data: AgendaFormData) => {
    const payload = {
      title: data.title,
      description: data.description?.trim() || undefined,
      display_order: data.display_order,
      options: data.options.map((option, index) => ({
        option_text: option.option_text.trim(),
        display_order: index + 1,
      })),
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

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Opcoes de voto</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ option_text: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar opcao
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`options.${index}.option_text`}>Opcao {index + 1}</Label>
                      <Input
                        id={`options.${index}.option_text`}
                        placeholder={index === 0 ? 'Ex.: Candidato A' : 'Ex.: Candidato B'}
                        {...register(`options.${index}.option_text` as const)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 2}
                      title={fields.length <= 2 ? 'Minimo de 2 opcoes' : 'Remover opcao'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.options?.[index]?.option_text && (
                    <p className="text-sm text-red-600">{errors.options[index]?.option_text?.message}</p>
                  )}
                </div>
              ))}

              {errors.options?.message && <p className="text-sm text-red-600">{errors.options.message}</p>}
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
