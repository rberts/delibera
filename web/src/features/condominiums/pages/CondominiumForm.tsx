/**
 * Condominium form (create/edit) with validation.
 * Ref: SPEC 7.5.3
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useCondominium,
  useCreateCondominium,
  useUpdateCondominium,
} from '../hooks/useCondominiums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const condominiumSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  address: z.string().min(1, 'Endereço é obrigatório'),
});

type CondominiumFormData = z.infer<typeof condominiumSchema>;

export default function CondominiumForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: condominium, isLoading } = useCondominium(Number(id));
  const createMutation = useCreateCondominium();
  const updateMutation = useUpdateCondominium(Number(id));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CondominiumFormData>({
    resolver: zodResolver(condominiumSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  useEffect(() => {
    if (condominium) {
      reset({
        name: condominium.name,
        address: condominium.address,
      });
    }
  }, [condominium, reset]);

  const onSubmit = (data: CondominiumFormData) => {
    if (isEditing) {
      updateMutation.mutate(data, {
        onSuccess: () => navigate('/condominiums'),
      });
      return;
    }

    createMutation.mutate(data, {
      onSuccess: () => navigate('/condominiums'),
    });
  };

  if (isEditing && isLoading) {
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
        <Button
          variant="ghost"
          onClick={() => navigate('/condominiums')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para condomínios
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? 'Editar Condomínio' : 'Novo Condomínio'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Condomínio</CardTitle>
          <CardDescription>Preencha os dados abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Condomínio Exemplo" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                placeholder="Rua Exemplo, 123 - São Paulo, SP"
                rows={3}
                {...register('address')}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Atualizar' : 'Criar'} condomínio
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/condominiums')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
