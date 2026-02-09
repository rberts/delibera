import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAssembly,
  useCreateAssembly,
  useUpdateAssembly,
} from '../hooks/useAssemblies';
import {
  useCondominium,
  useCondominiums,
} from '@/features/condominiums/hooks/useCondominiums';
import type { AssemblyType } from '@/types/api';

const assemblySchema = z.object({
  title: z.string().min(1, 'Titulo e obrigatorio').max(255),
  condominium_id: z.coerce.number().int().positive('Condominio e obrigatorio'),
  assembly_date: z.string().min(1, 'Data e obrigatoria'),
  location: z.string().min(1, 'Local e obrigatorio'),
  assembly_type: z.enum(['ordinary', 'extraordinary']),
});

type AssemblyFormData = z.infer<typeof assemblySchema>;

function formatForDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function localDateTimeToISO(value: string) {
  return new Date(value).toISOString();
}

export default function AssemblyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const assemblyId = Number(id);
  const { data: assembly, isLoading: isLoadingAssembly } = useAssembly(assemblyId);
  const { data: condominiumsData, isLoading: isLoadingCondominiums } = useCondominiums(1, 500, 'active');
  const currentCondominiumId = assembly?.condominium_id ?? 0;
  const { data: currentCondominium } = useCondominium(currentCondominiumId);

  const createMutation = useCreateAssembly();
  const updateMutation = useUpdateAssembly(assemblyId);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AssemblyFormData>({
    resolver: zodResolver(assemblySchema),
    defaultValues: {
      title: '',
      condominium_id: undefined,
      assembly_date: '',
      location: '',
      assembly_type: 'ordinary',
    },
  });

  useEffect(() => {
    if (!assembly) return;

    reset({
      title: assembly.title,
      condominium_id: assembly.condominium_id,
      assembly_date: formatForDateTimeLocal(assembly.assembly_date),
      location: assembly.location,
      assembly_type: assembly.assembly_type,
    });
  }, [assembly, reset]);

  const condominiumOptions = useMemo(() => {
    return [
      ...(condominiumsData?.items || []),
      ...(currentCondominium &&
      !(condominiumsData?.items || []).some((item) => item.id === currentCondominium.id)
        ? [currentCondominium]
        : []),
    ];
  }, [condominiumsData?.items, currentCondominium]);

  useEffect(() => {
    if (!assembly) return;
    const hasCurrentOption = condominiumOptions.some((item) => item.id === assembly.condominium_id);
    if (!hasCurrentOption) return;
    setValue('condominium_id', assembly.condominium_id, {
      shouldValidate: false,
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [assembly, condominiumOptions, setValue]);

  const onSubmit = (data: AssemblyFormData) => {
    const payload = {
      ...data,
      assembly_date: localDateTimeToISO(data.assembly_date),
      assembly_type: data.assembly_type as AssemblyType,
    };

    if (isEditing) {
      updateMutation.mutate(payload, {
        onSuccess: () => navigate(`/assemblies/${assemblyId}`),
      });
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => navigate('/assemblies'),
    });
  };

  if (isEditing && isLoadingAssembly) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/assemblies')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para assembleias
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? 'Editar Assembleia' : 'Nova Assembleia'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Assembleia</CardTitle>
          <CardDescription>Preencha os campos obrigatorios</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" placeholder="Assembleia Ordinaria 2026" {...register('title')} />
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Condominio</Label>
              <Controller
                control={control}
                name="condominium_id"
                render={({ field }) => (
                  <Select
                    key={`condo-select-${condominiumOptions.length}-${field.value ?? 'empty'}`}
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um condominio" />
                    </SelectTrigger>
                    <SelectContent>
                      {condominiumOptions.map((condominium) => (
                        <SelectItem key={condominium.id} value={String(condominium.id)}>
                          {condominium.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {isLoadingCondominiums && <p className="text-sm text-muted-foreground">Carregando condominios...</p>}
              {errors.condominium_id && <p className="text-sm text-red-600">{errors.condominium_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assembly_date">Data e hora</Label>
              <Input id="assembly_date" type="datetime-local" {...register('assembly_date')} />
              {errors.assembly_date && <p className="text-sm text-red-600">{errors.assembly_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Textarea id="location" rows={3} placeholder="Salao de festas" {...register('location')} />
              {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="assembly_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => field.onChange(value as AssemblyType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ordinary">Ordinaria</SelectItem>
                      <SelectItem value="extraordinary">Extraordinaria</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assembly_type && <p className="text-sm text-red-600">{errors.assembly_type.message}</p>}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Salvar alteracoes' : 'Criar assembleia'}
              </Button>

              <Button type="button" variant="outline" onClick={() => navigate('/assemblies')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
