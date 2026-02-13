import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePayments, useUpdatePayment } from "@/hooks/use-payments";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPaymentSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                     Nenhum pagamento encontrado.
                   </TableCell>
                 </TableRow>
              ) : (
                payments?.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} formatCurrency={formatCurrency} getStatusBadge={getStatusBadge} />
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardLayout>
  );
}

function PaymentRow({ payment, formatCurrency, getStatusBadge }: any) {
  const { mutateAsync, isLoading } = useUpdatePayment();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertPaymentSchema.partial()),
    defaultValues: {
      tipoPagamento: 'Asaas',
      valorRecebido: undefined,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await mutateAsync({ id: payment.id, data });
      toast({ title: 'Pagamento atualizado' });
      setOpen(false);
    } catch (err) {
      toast({ title: 'Erro ao atualizar pagamento', variant: 'destructive' });
    }
  };

  return (
    <>
      <TableRow className="hover:bg-slate-50/80 transition-colors">
        <TableCell className="font-medium text-slate-900">#{payment.lease.id} - R$ {payment.lease.value}</TableCell>
        <TableCell>{format(new Date(payment.dueDate), 'dd/MM/yyyy')}</TableCell>
        <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
        <TableCell>{getStatusBadge(payment.status)}</TableCell>
        <TableCell>
          {payment.paymentDate ? format(new Date(payment.paymentDate), 'dd/MM/yyyy') : '-'}
        </TableCell>
        <TableCell>
          {payment.status !== 'RECEIVED' ? (
            <Button onClick={() => setOpen(true)} className="bg-green-600">Baixa Manual</Button>
          ) : null}
        </TableCell>
      </TableRow>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Baixa Manual - Pagamento #{payment.id}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tipoPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value as any}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Asaas">Asaas</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Cartão">Cartão</SelectItem>
                        <SelectItem value="Pix">Pix</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valorRecebido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Recebido (R$)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder={String(payment.amount)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" className="bg-blue-600" disabled={isLoading}>
                  Confirmar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
