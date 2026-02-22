import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CheckinPage from './CheckinPage';

const mutateMock = vi.fn();

vi.mock('@/features/assemblies/hooks/useAssemblies', () => ({
  useAssembly: () => ({
    data: { id: 1, title: 'Assembleia Teste' },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../hooks/useCheckin', () => ({
  useAttendanceList: () => ({ data: { items: [] }, isLoading: false, error: null }),
  useCheckinUnits: () => ({ data: { items: [] }, isLoading: false, error: null }),
  useQuorum: () => ({
    data: { total_units: 10, units_present: 0, fraction_present: 0, quorum_reached: false },
    isLoading: false,
    error: null,
  }),
  useAssignQRCode: () => ({ mutate: mutateMock, isPending: false }),
  useUndoCheckin: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../components/AttendanceList', () => ({
  AttendanceList: () => <div>Attendance List</div>,
}));

vi.mock('../components/QRScanner', () => ({
  QRScanner: ({ onScan }: { onScan: (token: string) => void }) => (
    <button type="button" onClick={() => onScan('scanned-token')}>
      Simular scan
    </button>
  ),
}));

vi.mock('../components/UnitSelector', () => ({
  UnitSelector: ({
    onSubmit,
  }: {
    onSubmit: (payload: { unitIds: number[]; isProxy: boolean }) => void;
  }) => (
    <button type="button" onClick={() => onSubmit({ unitIds: [11], isProxy: true })}>
      Confirmar mock
    </button>
  ),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '1' }),
  };
});

describe('CheckinPage', () => {
  beforeEach(() => {
    mutateMock.mockReset();
  });

  it('sends qr_visual_number for manual check-in', async () => {
    render(<CheckinPage />);

    fireEvent.change(screen.getByLabelText('Numero visual do QR (manual)'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar mock' }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
    });
    const payload = mutateMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      qr_visual_number: 5,
      qr_token: undefined,
      unit_ids: [11],
      is_proxy: true,
    });
  });

  it('sends qr_token when coming from scanner', async () => {
    render(<CheckinPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Simular scan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar mock' }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
    });
    const payload = mutateMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      qr_token: 'scanned-token',
      qr_visual_number: undefined,
      unit_ids: [11],
      is_proxy: true,
    });
  });

  it('cleans manual input only on success and keeps it on error', async () => {
    mutateMock.mockImplementationOnce((_payload, options) => {
      options?.onError?.(new Error('fail'));
    });

    render(<CheckinPage />);

    const input = screen.getByLabelText('Numero visual do QR (manual)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar mock' }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
    });
    expect(input.value).toBe('9');

    mutateMock.mockImplementationOnce((_payload, options) => {
      options?.onSuccess?.({}, null, null, null);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar mock' }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(2);
      expect(input.value).toBe('');
    });
  });
});
