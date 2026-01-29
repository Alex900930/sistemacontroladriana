import { useDashboardStats } from "@/hooks/use-dashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { 
  Building2, 
  Users, 
  FileCheck, 
  AlertCircle, 
  Wallet 
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const chartData = [
    { name: 'Pendente', value: Number(stats?.pendingPaymentsAmount || 0), color: '#fbbf24' }, // Amber
    { name: 'Recebido', value: Number(stats?.receivedPaymentsAmount || 0), color: '#22c55e' }, // Green
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Painel Geral</h1>
        <p className="text-slate-500 mt-2">Visão geral do seu portfólio imobiliário</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total de Imóveis"
          value={stats?.totalProperties || 0}
          icon={Building2}
          description="Imóveis cadastrados"
        />
        <StatCard
          title="Inquilinos"
          value={stats?.totalTenants || 0}
          icon={Users}
          description="Inquilinos ativos"
        />
        <StatCard
          title="Contratos Ativos"
          value={stats?.activeLeases || 0}
          icon={FileCheck}
          description="Contratos vigentes"
        />
        <StatCard
          title="Receita Pendente"
          value={formatCurrency(Number(stats?.pendingPaymentsAmount || 0))}
          icon={AlertCircle}
          className="border-l-4 border-l-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle className="text-lg font-display text-slate-800 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              Fluxo de Receita
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Placeholder for Recent Activity or Notifications */}
        <Card className="shadow-md border-none bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-display">Dica do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-100 leading-relaxed">
              Mantenha seus contratos atualizados com o índice de reajuste correto. 
              O sistema verifica automaticamente os vencimentos e gera os boletos no Asaas 
              5 dias antes do vencimento.
            </p>
            <div className="mt-6 flex gap-3">
              <div className="bg-white/10 p-4 rounded-lg flex-1 backdrop-blur-sm">
                <span className="block text-2xl font-bold">{stats?.activeLeases}</span>
                <span className="text-xs text-blue-200 uppercase tracking-wider">Ativos</span>
              </div>
              <div className="bg-white/10 p-4 rounded-lg flex-1 backdrop-blur-sm">
                <span className="block text-2xl font-bold">{stats?.totalProperties}</span>
                <span className="text-xs text-blue-200 uppercase tracking-wider">Imóveis</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
