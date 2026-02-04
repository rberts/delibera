/**
 * Dashboard Page - Página inicial (stub)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, QrCode, BarChart } from 'lucide-react';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do sistema de votação</p>
      </div>

      {/* Cards de estatísticas (mock) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Condomínios
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500 mt-1">Total cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Assembleias
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500 mt-1">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              QR Codes
            </CardTitle>
            <QrCode className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500 mt-1">Gerados este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Votos
            </CardTitle>
            <BarChart className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500 mt-1">Total registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder para futuras features */}
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Delibera</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Sistema de votação para assembleias condominiais com QR codes e atualizações em tempo real.
          </p>
          <p className="text-gray-600 mt-2">
            Use o menu lateral para navegar entre as funcionalidades.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
