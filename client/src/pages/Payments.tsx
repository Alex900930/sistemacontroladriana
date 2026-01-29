import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePayments } from "@/hooks/use-payments";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Payments() {
  const [status, setStatus] = useState<'PENDING' | 'RECEIVED' | 'OVERDUE' | 'ALL'>('ALL');
  const { data: payments, isLoading } = usePayments(status === 'ALL' ? undefined : status);

  const formatCurrency = (val: string) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Recebido</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Atrasado</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Pendente</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pagamentos</h1>
          <p className="text-slate-500 mt-1">Histórico financeiro e cobranças</p>
        </div>
      </div>

      <div className="mb-6">
        <Tabs value={status} onValueChange={(v) => setStatus(v as any)} className="w-full sm:w-auto">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto">
            <TabsTrigger value="ALL" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Todos</TabsTrigger>
            <TabsTrigger value="PENDING" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">Pendentes</TabsTrigger>
            <TabsTrigger value="RECEIVED" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">Recebidos</TabsTrigger>
            <TabsTrigger value="OVERDUE" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">Atrasados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-slate-50/50">
                <TableHead>Contrato</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                     Nenhum pagamento encontrado.
                   </TableCell>
                 </TableRow>
              ) : (
                payments?.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-medium text-slate-900">
                      #{payment.lease.id} - R$ {payment.lease.value}
                    </TableCell>
                    <TableCell>{format(new Date(payment.dueDate), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {payment.paymentDate ? format(new Date(payment.paymentDate), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardLayout>
  );
}
