import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VotingPage from './VotingPage';

const mockSubmitVote = vi.fn();
const useVotingMock = vi.fn();

vi.mock('../hooks/useVoting', () => ({
  useVoting: (token: string) => useVotingMock(token),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ token: 'test-token' }),
  };
});

describe('VotingPage', () => {
  beforeEach(() => {
    mockSubmitVote.mockReset();
    useVotingMock.mockReset();
  });

  it('renders loading state', () => {
    useVotingMock.mockReturnValue({
      assembly: null,
      agenda: null,
      units: [],
      hasVoted: false,
      isLoading: true,
      error: null,
      submitVote: mockSubmitVote,
      isSubmitting: false,
    });

    render(<VotingPage />);
    expect(screen.getAllByRole('generic').length).toBeGreaterThan(0);
  });

  it('renders has-voted state', () => {
    useVotingMock.mockReturnValue({
      assembly: {
        id: 1,
        title: 'Assembleia Teste',
        condominium_id: 1,
        assembly_date: '2026-02-20T19:00:00',
        location: 'Salao',
        assembly_type: 'ordinary',
        status: 'in_progress',
        created_at: '2026-02-20T18:00:00',
        updated_at: '2026-02-20T18:00:00',
      },
      agenda: null,
      units: [],
      hasVoted: true,
      isLoading: false,
      error: null,
      submitVote: mockSubmitVote,
      isSubmitting: false,
    });

    render(<VotingPage />);
    expect(screen.getByText('Voto registrado')).toBeInTheDocument();
    expect(screen.getByText('Seu voto foi registrado com sucesso.')).toBeInTheDocument();
  });

  it('renders open agenda and vote button', () => {
    useVotingMock.mockReturnValue({
      assembly: {
        id: 1,
        title: 'Assembleia Teste',
        condominium_id: 1,
        assembly_date: '2026-02-20T19:00:00',
        location: 'Salao',
        assembly_type: 'ordinary',
        status: 'in_progress',
        created_at: '2026-02-20T18:00:00',
        updated_at: '2026-02-20T18:00:00',
      },
      agenda: {
        id: 10,
        assembly_id: 1,
        title: 'Aprovar orçamento',
        description: 'Descrição da pauta',
        status: 'open',
        display_order: 1,
        created_at: '2026-02-20T18:00:00',
        options: [
          { id: 100, agenda_id: 10, option_text: 'Sim', display_order: 1 },
          { id: 101, agenda_id: 10, option_text: 'Nao', display_order: 2 },
        ],
      },
      units: [{ id: 1, unit_number: '101', owner_name: 'Maria' }],
      hasVoted: false,
      isLoading: false,
      error: null,
      submitVote: mockSubmitVote,
      isSubmitting: false,
    });

    render(<VotingPage />);
    expect(screen.getByText('Aprovar orçamento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar voto' })).toBeInTheDocument();
  });
});
