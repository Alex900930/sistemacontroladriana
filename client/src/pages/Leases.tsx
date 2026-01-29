import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLeases, useCreateLease, useSyncAsaas } from "@/hooks/use-leases";
import { useProperties } from "@/hooks/use-properties";
import { useTenants } from "@/hooks/use-tenants";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeaseSchema, type InsertLease, type LeaseWithDetails } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function Leases() {
  const { data: leases, isLoading } = useLeases();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = leases?.filter(l => 
    l.property.address.toLowerCase().includes(search.toLowerCase()) ||
    l.tenant.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contratos</h1>
          <p className="text-slate-500 mt-1">Gestão de contratos de locação</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
          <Plus className="mr-2 h-4 w-4" /> Novo Contrato
        </Button>
      </div>

      <div className="space-y-4">
        <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por imóvel ou inquilino..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200"
            />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
            Nenhum contrato encontrado.
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered?.map((lease) => (
              <LeaseCard key={lease.id} lease={lease} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Novo Contrato de Locação</DialogTitle>
          </DialogHeader>
          <LeaseForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function LeaseCard({ lease }: { lease: LeaseWithDetails }) {
  const { mutate: sync, isPending } = useSyncAsaas();
  const { toast } = useToast();

  const handleSync = () => {
    sync(lease.id, {
      onSuccess: () => toast({ title: "Sincronização iniciada com Asaas!" }),
      onError: () => toast({ title: "Erro ao sincronizar", variant: "destructive" })
    });
  };

  const formatCurrency = (val: string) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-blue-600 hidden sm:block">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900">{lease.property.address}</h3>
            <Badge variant={lease.status === 'ACTIVE' ? 'default' : 'secondary'} className={lease.status === 'ACTIVE' ? 'bg-green-500 hover:bg-green-600' : ''}>
              {lease.status === 'ACTIVE' ? 'Ativo' : lease.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">Inquilino: <span className="font-medium text-slate-700">{lease.tenant.name}</span></p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
             <span>Valor: <span className="font-semibold text-slate-900">{formatCurrency(lease.value)}</span></span>
             <span>Vencimento: Dia {lease.dueDay}</span>
             <span>Índice: {lease.adjustmentIndex}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        {!lease.asaasSubscriptionId ? (
          <Button onClick={handleSync} disabled={isPending} variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sincronizar Asaas
          </Button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-100">
            <RefreshCw className="h-4 w-4" /> Sincronizado
          </div>
        )}
        <div className="text-xs text-slate-400 text-right sm:text-left self-center">
          Início: {format(new Date(lease.startDate), 'dd/MM/yyyy')}
        </div>
      </div>
    </div>
  );
}

function LeaseForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();
  const { mutate: createLease, isPending } = useCreateLease();
  const { toast } = useToast();

  const form = useForm<InsertLease>({
    resolver: zodResolver(insertLeaseSchema),
    defaultValues: {
      value: 0,
      dueDay: 5,
      adjustmentIndex: 'IPCA',
      status: 'ACTIVE',
    },
  });

  const onSubmit = (data: InsertLease) => {
    // Coerce types manually just to be safe before sending
    const payload = {
        ...data,
        propertyId: Number(data.propertyId),
        tenantId: Number(data.tenantId),
        value: Number(data.value),
        dueDay: Number(data.dueDay),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
    };

    createLease(payload, {
      onSuccess: () => {
        toast({ title: "Contrato criado!" });
        onSuccess();
      },
      onError: () => toast({ title: "Erro ao criar", variant: "destructive" })
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="propertyId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Imóvel</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value ? String(field.value) : undefined}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {properties?.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.address}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="tenantId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Inquilino</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value ? String(field.value) : undefined}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {tenants?.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Valor do Aluguel (R$)</FormLabel>
                <FormControl>
                    <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="dueDay"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Dia do Vencimento</FormLabel>
                <FormControl>
                    <Input {...field} type="number" min="1" max="31" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
             <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Início</FormLabel>
                <FormControl>
                    <Input 
                        type="date" 
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Término</FormLabel>
                <FormControl>
                    <Input 
                         type="date" 
                         value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                         onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

         <FormField
            control={form.control}
            name="adjustmentIndex"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Índice de Reajuste</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="IGP-M">IGP-M</SelectItem>
                        <SelectItem value="IPCA">IPCA</SelectItem>
                        <SelectItem value="INPC">INPC</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending} className="bg-blue-600">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Criar Contrato
          </Button>
        </div>
      </form>
    </Form>
  );
}
