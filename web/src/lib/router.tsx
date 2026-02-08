/**
 * Router Configuration - React Router v6 com lazy loading
 * Ref: SPEC 7.4.5
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import CondominiumsList from '@/features/condominiums/pages/CondominiumsList';
import CondominiumForm from '@/features/condominiums/pages/CondominiumForm';
import AssembliesList from '@/features/assemblies/pages/AssembliesList';
import AssemblyForm from '@/features/assemblies/pages/AssemblyForm';
import AssemblyDetails from '@/features/assemblies/pages/AssemblyDetails';
import QRCodesList from '@/features/qr-codes/pages/QRCodesList';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Páginas stub para rotas futuras
function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-gray-600 mt-2">Página não encontrada</p>
      </div>
    </div>
  );
}

function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">Em desenvolvimento...</p>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, isLoadingUser } = useAuth();

  if (isLoadingUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm text-gray-600">Carregando...</div>
      </div>
    );
  }

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

export const router = createBrowserRouter([
  // Rota raiz - redireciona baseado em autenticação
  {
    path: '/',
    element: <RootRedirect />,
  },

  // Rotas públicas
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Rotas protegidas (com Layout)
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/condominiums',
        element: <CondominiumsList />,
      },
      {
        path: '/condominiums/new',
        element: <CondominiumForm />,
      },
      {
        path: '/condominiums/:id/edit',
        element: <CondominiumForm />,
      },
      {
        path: '/assemblies',
        element: <AssembliesList />,
      },
      {
        path: '/assemblies/new',
        element: <AssemblyForm />,
      },
      {
        path: '/assemblies/:id',
        element: <AssemblyDetails />,
      },
      {
        path: '/assemblies/:id/edit',
        element: <AssemblyForm />,
      },
      {
        path: '/assemblies/:id/checkin',
        element: <ComingSoonPage title="Check-in" />,
      },
      {
        path: '/assemblies/:id/operate',
        element: <ComingSoonPage title="Dashboard do Operador" />,
      },
      {
        path: '/qr-codes',
        element: <QRCodesList />,
      },
    ],
  },

  // Rota pública de votação (sem layout)
  {
    path: '/vote/:token',
    element: <ComingSoonPage title="Votação" />,
  },

  // 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
