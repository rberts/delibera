import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSelectUnitsByOwner } from '../hooks/useCheckin';

interface UnitSelectorProps {
  assemblyId: number;
  onSubmit: (params: { unitIds: number[]; isProxy: boolean }) => void;
  isSubmitting: boolean;
}

function parseIds(input: string): number[] {
  return input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
}

export function UnitSelector({ assemblyId, onSubmit, isSubmitting }: UnitSelectorProps) {
  const [ownerName, setOwnerName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [manualIds, setManualIds] = useState('');
  const [isProxy, setIsProxy] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);

  const selectByOwnerMutation = useSelectUnitsByOwner(assemblyId);

  const mergedUnitIds = useMemo(() => {
    const fromManual = parseIds(manualIds);
    return Array.from(new Set([...selectedUnitIds, ...fromManual]));
  }, [manualIds, selectedUnitIds]);

  const addByOwner = () => {
    if (!ownerName.trim()) return;

    selectByOwnerMutation.mutate(
      {
        owner_name: ownerName.trim(),
        cpf_cnpj: cpfCnpj.trim() || undefined,
      },
      {
        onSuccess: (ids) => {
          setSelectedUnitIds((current) => Array.from(new Set([...current, ...ids])));
        },
      }
    );
  };

  const removeId = (id: number) => {
    setSelectedUnitIds((current) => current.filter((item) => item !== id));
    const parsed = parseIds(manualIds).filter((item) => item !== id);
    setManualIds(parsed.join(', '));
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="owner-name">Selecionar todas por proprietario</Label>
          <Input
            id="owner-name"
            placeholder="Nome do proprietario"
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf-cnpj">CPF/CNPJ (opcional)</Label>
          <Input
            id="cpf-cnpj"
            placeholder="Somente para refinar"
            value={cpfCnpj}
            onChange={(event) => setCpfCnpj(event.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <Button type="button" variant="outline" onClick={addByOwner} disabled={isSubmitting || selectByOwnerMutation.isPending}>
          {selectByOwnerMutation.isPending ? 'Buscando...' : 'Adicionar unidades do proprietario'}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manual-ids">IDs das unidades (manual)</Label>
        <Input
          id="manual-ids"
          placeholder="Ex: 12, 13, 21"
          value={manualIds}
          onChange={(event) => setManualIds(event.target.value)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Use este campo como fallback quando nao souber o nome exato do proprietario.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="proxy"
          checked={isProxy}
          onCheckedChange={(checked) => setIsProxy(checked === true)}
          disabled={isSubmitting}
        />
        <Label htmlFor="proxy">Esta representando por procuracao</Label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Unidades selecionadas ({mergedUnitIds.length})</p>
        {mergedUnitIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma unidade selecionada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {mergedUnitIds.map((id) => (
              <button
                key={id}
                type="button"
                className="rounded-full border px-3 py-1 text-xs"
                onClick={() => removeId(id)}
              >
                #{id} x
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        onClick={() => onSubmit({ unitIds: mergedUnitIds, isProxy })}
        disabled={isSubmitting || mergedUnitIds.length === 0}
      >
        {isSubmitting ? 'Confirmando...' : 'Confirmar check-in'}
      </Button>
    </div>
  );
}
