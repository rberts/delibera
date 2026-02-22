import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnitSelector } from './UnitSelector';
import type { AssemblyUnit } from '@/features/assemblies/hooks/useAssemblyUnits';

const units: AssemblyUnit[] = [
  {
    id: 1,
    assembly_id: 1,
    unit_number: '101',
    owner_name: 'Joao Silva',
    ideal_fraction: 2.5,
    cpf_cnpj: '123.456.789-09',
    created_at: '2026-01-01T10:00:00',
  },
];

describe('UnitSelector', () => {
  it('does not render manual unit id field anymore', () => {
    render(
      <UnitSelector
        units={units}
        isLoadingUnits={false}
        onSubmit={vi.fn()}
        isSubmitting={false}
        hasQrIdentifier={true}
      />
    );

    expect(screen.queryByLabelText('IDs das unidades (manual)')).not.toBeInTheDocument();
  });
});
