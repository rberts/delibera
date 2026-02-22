import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AssemblyUnit } from '@/features/assemblies/hooks/useAssemblyUnits';

interface UnitSelectorProps {
  units: AssemblyUnit[];
  isLoadingUnits: boolean;
  onSubmit: (params: { unitIds: number[]; isProxy: boolean }) => void;
  isSubmitting: boolean;
  hasQrIdentifier: boolean;
}

export function UnitSelector({
  units,
  isLoadingUnits,
  onSubmit,
  isSubmitting,
  hasQrIdentifier,
}: UnitSelectorProps) {
  const [search, setSearch] = useState('');
  const [isProxy, setIsProxy] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);

  const filteredUnits = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return units;
    return units.filter((unit) => {
      return (
        unit.unit_number.toLowerCase().includes(term)
        || unit.owner_name.toLowerCase().includes(term)
        || unit.cpf_cnpj.toLowerCase().includes(term)
      );
    });
  }, [search, units]);

  const unitsById = useMemo(() => {
    return new Map(units.map((unit) => [unit.id, unit]));
  }, [units]);

  const ownerBuckets = useMemo(() => {
    const buckets = new Map<string, number[]>();
    for (const unit of units) {
      const ownerKey = `${unit.owner_name.trim().toLowerCase()}|${unit.cpf_cnpj}`;
      const list = buckets.get(ownerKey) ?? [];
      list.push(unit.id);
      buckets.set(ownerKey, list);
    }
    return buckets;
  }, [units]);

  const toggleUnit = (unit: AssemblyUnit, checked: boolean) => {
    const ownerKey = `${unit.owner_name.trim().toLowerCase()}|${unit.cpf_cnpj}`;
    const sameOwnerIds = ownerBuckets.get(ownerKey) ?? [unit.id];
    if (checked) {
      setSelectedUnitIds((current) => Array.from(new Set([...current, ...sameOwnerIds])));
      return;
    }
    setSelectedUnitIds((current) => current.filter((id) => id !== unit.id));
  };

  const selectAllVisible = () => {
    const visibleIds = filteredUnits.map((unit) => unit.id);
    setSelectedUnitIds((current) => Array.from(new Set([...current, ...visibleIds])));
  };

  const clearSelection = () => {
    setSelectedUnitIds([]);
  };

  const removeId = (id: number) => {
    setSelectedUnitIds((current) => current.filter((item) => item !== id));
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="space-y-2">
        <Label htmlFor="unit-search">Buscar unidade/proprietario/CPF-CNPJ</Label>
        <Input
          id="unit-search"
          placeholder="Ex: 101, Joao Silva, 12.345.678/0001-95"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={isSubmitting || isLoadingUnits}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={selectAllVisible}
          disabled={isSubmitting || isLoadingUnits || filteredUnits.length === 0}
        >
          Selecionar visiveis
        </Button>
        <Button type="button" variant="outline" onClick={clearSelection} disabled={isSubmitting}>
          Limpar selecao
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Sel.</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Proprietario</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Fracao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingUnits ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Carregando unidades...
                </TableCell>
              </TableRow>
            ) : filteredUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma unidade encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredUnits.map((unit) => {
                const checked = selectedUnitIds.includes(unit.id);
                return (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleUnit(unit, value === true)}
                        disabled={isSubmitting}
                      />
                    </TableCell>
                    <TableCell>{unit.unit_number}</TableCell>
                    <TableCell>{unit.owner_name}</TableCell>
                    <TableCell>{unit.cpf_cnpj}</TableCell>
                    <TableCell>{unit.ideal_fraction.toFixed(2)}%</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
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
        <p className="text-sm font-medium">Unidades selecionadas ({selectedUnitIds.length})</p>
        {selectedUnitIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma unidade selecionada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedUnitIds.map((id) => (
              <button
                key={id}
                type="button"
                className="rounded-full border px-3 py-1 text-xs"
                onClick={() => removeId(id)}
              >
                {unitsById.get(id)?.unit_number ? `Un ${unitsById.get(id)?.unit_number}` : `#${id}`} x
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        onClick={() => onSubmit({ unitIds: selectedUnitIds, isProxy })}
        disabled={isSubmitting || selectedUnitIds.length === 0 || !hasQrIdentifier}
      >
        {isSubmitting ? 'Confirmando...' : 'Confirmar check-in'}
      </Button>
    </div>
  );
}
