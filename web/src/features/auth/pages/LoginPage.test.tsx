import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoggingIn: false,
    isAuthenticated: false,
    isLoadingUser: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('renders form fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('shows validation errors for invalid values', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
    expect(await screen.findByText('Senha deve ter no mínimo 6 caracteres')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits valid credentials', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@delibera.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@delibera.com',
        password: '123456',
      });
    });
  });
});
