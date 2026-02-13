import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLeases, useCreateLease, useSyncAsaas, useDeleteLease, useUpdateLease } from "@/hooks/use-leases";
import { useProperties } from "@/hooks/use-properties";
import { useTenants } from "@/hooks/use-tenants";
import { Button } from "@/components/ui/button";
// CORRECCIÓN: Se agregaron Edit3 y Trash2 a las importaciones
import { Plus, Search, FileText, RefreshCw, Loader2, Edit3, Trash2 } from "lucide-react"; 
import { Input } from "@/components/ui/input";
import { z } from "zod";
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
import { insertLeaseSchema, type InsertLease, type LeaseWithDetails, type Lease } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Leases() {
 const { data: leases, isLoading } = useLeases();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);

   // --- NUEVOS ESTADOS PARA RESCISIÓN ---
  const [isTerminationOpen, setIsTerminationOpen] = useState(false);
  const [terminatingLease, setTerminatingLease] = useState<LeaseWithDetails | null>(null);

  const [isDocsOpen, setIsDocsOpen] = useState(false);
const [selectedLeaseForDocs, setSelectedLeaseForDocs] = useState<LeaseWithDetails | null>(null);

  const filtered = leases?.filter(l => 
    l.property.address.toLowerCase().includes(search.toLowerCase()) ||
    l.tenant.name.toLowerCase().includes(search.toLowerCase())
  );

  // 2. Función para abrir
const handleShowDocs = (lease: LeaseWithDetails) => {
  setSelectedLeaseForDocs(lease);
  setIsDocsOpen(true);
};

   // --- NUEVA FUNCIÓN PARA ABRIR LA RESCISIÓN ---
  const handleTerminate = (lease: LeaseWithDetails) => {
    setTerminatingLease(lease);
    setIsTerminationOpen(true);
  };

  const handleEdit = (lease: Lease) => {
    setEditingLease(lease);
    setIsOpen(true);
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setEditingLease(null);
    setIsTerminationOpen(false); // Cerramos ambos por seguridad
    setTerminatingLease(null);
  };

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
                <LeaseCard 
                  key={lease.id} 
                  lease={lease} 
                  onEdit={() => handleEdit(lease as any)} 
                  onTerminate={() => handleTerminate(lease)}
                  onShowDocs={handleShowDocs} // <-- AGREGA ESTA LÍNEA (pasa la función handleShowDocs)
                />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingLease ? "Editar Contrato" : "Novo Contrato de Locação"}</DialogTitle>
          </DialogHeader>
          <LeaseForm 
            onSuccess={handleClose} 
            leaseToEdit={editingLease || undefined} 
          />
        </DialogContent>
      </Dialog>

       {/* --- NUEVO DIÁLOGO 2: RESCISIÓN --- */}
     <Dialog open={isTerminationOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-orange-600 flex items-center gap-2">
              <FileText className="h-5 w-5" /> Rescisão de Contrato
            </DialogTitle>
          </DialogHeader>
          
          {/* Este componente es el que tiene los checkboxes de Adriana */}
          {terminatingLease && (
            <TerminationForm 
              lease={terminatingLease} 
              onSuccess={handleClose} 
            />
          )}
        </DialogContent>
      </Dialog>

      {selectedLeaseForDocs && (
  <RescisionDocsModal 
    lease={selectedLeaseForDocs} 
    isOpen={isDocsOpen} 
    onClose={() => setIsDocsOpen(false)} 
  />
)}
    </DashboardLayout>
  );
}

function LeaseCard({ lease, onEdit, onTerminate, onShowDocs }: { 
  lease: LeaseWithDetails; 
  onEdit: () => void; 
  onTerminate: () => void;
  onShowDocs: (lease: LeaseWithDetails) => void; // <-- AGREGAR ESTA LÍNEA
}) {
 const { mutate: sync, isPending } = useSyncAsaas();
  const { mutate: deleteLease } = useDeleteLease();
  const { toast } = useToast();

  const handleSync = () => {
    sync(lease.id, {
      onSuccess: () => toast({ title: "Sincronização iniciada com Asaas!" }),
      onError: () => toast({ title: "Erro ao sincronizar", variant: "destructive" })
    });
  };

const handleDelete = () => {
  if (window.confirm("Tem certeza que deseja excluir este contrato?")) {
    deleteLease(lease.id, { // <--- Verifica que lease.id sea un número válido
      onSuccess: () => toast({ title: "Contrato excluído" }),
      onError: () => toast({ title: "Erro ao excluir", variant: "destructive" })
    });
  }
};

  const formatCurrency = (val: string) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));

  return (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-md transition-shadow">
       <div className="absolute top-0 right-0 bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-400 rounded-bl-lg">
        CONTRATO #{lease.id}
      </div>
      <div className="flex items-start gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-blue-600 hidden sm:block">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h3 className="font-bold text-slate-900">
              <span className="text-blue-600 mr-2">#{lease.id}</span>
              {lease.property.address}
            </h3>
            <Badge variant={lease.status === 'ACTIVE' ? 'default' : 'secondary'} className={lease.status === 'ACTIVE' ? 'bg-green-500 hover:bg-green-600' : ''}>
              {lease.status === 'ACTIVE' ? 'Ativo' : lease.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">Inquilino: <span className="font-medium text-slate-700">{lease.tenant.name}</span></p>
          
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mensalidade</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(lease.value)} <span className="text-slate-400 font-normal text-xs">(Dia {lease.dueDay})</span>
              </span>
            </div>

            <div className="flex flex-col border-l pl-6 border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Garantia</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium">
                  {lease.garantiaTipo || "N/A"}
                </Badge>
                {lease.garantiaTipo === "Caução" && lease.inicioCobranca && (
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100 shadow-none font-semibold">
                    Cobrança: {format(new Date(lease.inicioCobranca), 'dd/MM/yyyy')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!lease.asaasSubscriptionId ? (
          <Button onClick={handleSync} disabled={isPending} variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50 h-9">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Asaas
          </Button>
        ) : (
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">Sincronizado</Badge>
        )}

        <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 text-slate-600" onClick={onEdit}>
          <Edit3 className="h-4 w-4" />
        </Button>

        {lease.status === 'TERMINATED' ? (
    // BOTÓN NUEVO PARA CONTRATOS FINALIZADOS
    <Button 
      variant="outline" 
      size="sm" 
      className="h-9 text-blue-600 border-blue-100 hover:bg-blue-50 font-medium"
      onClick={() => onShowDocs(lease)} // Necesitaremos esta prop nueva
    >
      <FileText className="mr-2 h-4 w-4" /> Documentos
    </Button>
  ) : (
    // BOTÓN DE RESCINDIR (Solo para activos)
    <Button 
      variant="outline" 
      size="sm" 
      className="h-9 text-orange-600 border-orange-100 hover:bg-orange-50 font-medium"
      onClick={onTerminate}
    >
      <Edit3 className="mr-2 h-4 w-4" /> Rescindir
    </Button>
  )}


        <Button variant="outline" size="icon" className="h-9 w-9 border-red-100 text-red-500 hover:bg-red-50" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Nuevo componente para el formulario de rescisión
function TerminationForm({ lease, onSuccess }: { lease: LeaseWithDetails; onSuccess: () => void }) {
  const { mutate: updateLease, isPending } = useUpdateLease();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      status: "TERMINATED",
      dataRescisao: new Date(),
      dataEntregaChaves: new Date(),
      hasTermoChaves: lease.hasTermoChaves || false,
      hasRescisaoContrato: lease.hasRescisaoContrato || false,
      hasDistratoComDebitos: lease.hasDistratoComDebitos || false,
      hasDistratoSemDebitos: lease.hasDistratoSemDebitos || false,
    }
  });

 const onSubmit = (data: any) => {
  updateLease({ id: lease.id, data }, {
    onSuccess: () => {
      toast({ title: "Contrato finalizado com sucesso!" });
      onSuccess(); // Aquí cerramos el modal solo si todo salió bien
    },
    onError: (error: any) => {
      // AQUÍ ES DONDE SALTA EL MENSAJE EN ROJO SI HAY DEUDA
      toast({ 
        title: "Não foi possível finalizar", 
        description: error.message || "Existem pendências financeiras neste contrato.", 
        variant: "destructive" 
      });
      // Importante: No llamamos a onSuccess(), así el modal se queda abierto para que Adriana vea el error
    }
  });
};

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <h4 className="text-orange-800 font-bold text-sm uppercase">Rescisão do Contrato #{lease.id}</h4>
          <p className="text-orange-600 text-xs">O sistema bloqueia a finalização se houver boletos abertos.</p>
        </div>

        <div className="space-y-3">
          <FormField control={form.control} name="hasTermoChaves" render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" /></FormControl>
              <FormLabel>Termo de entrega de chaves ✅</FormLabel>
            </FormItem>
          )} />
          <FormField control={form.control} name="hasRescisaoContrato" render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" /></FormControl>
              <FormLabel>Rescisão De contrato ✅</FormLabel>
            </FormItem>
          )} />
          <FormField control={form.control} name="hasDistratoComDebitos" render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" /></FormControl>
              <FormLabel>Distrato com Débitos ✅</FormLabel>
            </FormItem>
          )} />
          <FormField control={form.control} name="hasDistratoSemDebitos" render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" /></FormControl>
              <FormLabel>Distrato Sem Débitos ✅</FormLabel>
            </FormItem>
          )} />
        </div>

        <Button type="submit" disabled={isPending} className="w-full bg-orange-600 ...">
          {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
          Confirmar Término do Contrato
        </Button>
      </form>
    </Form>
  );
}

function RescisionDocsModal({ lease, isOpen, onClose }: { lease: LeaseWithDetails, isOpen: boolean, onClose: () => void }) {
  const [selectedDoc, setSelectedDoc] = useState<'chaves' | 'distrato'>('chaves');

  // PLANTILLA DINÁMICA
  const generateChavesTemplate = () => {
    const dataTermo = lease.dataEntregaChaves ? format(new Date(lease.dataEntregaChaves), "dd/MM/yyyy") : "___/___/______";
    return `
TERMO DE ENTREGA DE CHAVES E VISTORIA

Pelo presente instrumento, eu, ${lease.tenant.name.toUpperCase()}, portador(a) del CPF nº ${lease.tenant.cpfCnpj}, na qualidade de Locatário(a) do imóvel situado em ${lease.property.address}, declaro que nesta data de ${dataTermo}, faço la entrega das chaves do referido imóvel à administradora Poitevin Imóveis.

O locatário declara estar ciente de que a entrega das chaves não quita débitos anteriores, caso existam, referentes a aluguel, encargos ou danos apurados na vistoria final.

Assinatura: ____________________________________
Data: ${dataTermo}
    `.trim();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Documento copiado! Agora você pode colar no Word ou WhatsApp.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="text-blue-600" /> Documentos de Rescisão - #{lease.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4">
          <Button variant={selectedDoc === 'chaves' ? 'default' : 'outline'} onClick={() => setSelectedDoc('chaves')}>
            Termo de Chaves
          </Button>
          <Button variant={selectedDoc === 'distrato' ? 'default' : 'outline'} onClick={() => setSelectedDoc('distrato')}>
            Distrato (Rescisão)
          </Button>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 font-mono text-xs whitespace-pre-wrap min-h-[300px]">
          {selectedDoc === 'chaves' ? generateChavesTemplate() : "Em breve: Modelo de Distrato Legal..."}
        </div>

        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => copyToClipboard(generateChavesTemplate())}>
            Copiar Texto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeaseForm({ onSuccess, leaseToEdit }: { onSuccess: () => void; leaseToEdit?: Lease }) {
  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();
  const { mutate: createLease, isPending: isCreating } = useCreateLease();
  const { mutate: updateLease, isPending: isUpdating } = useUpdateLease();
  const { toast } = useToast();

  const isPending = isCreating || isUpdating;

  const form = useForm<InsertLease>({
    resolver: zodResolver(
      insertLeaseSchema.extend({
        propertyId: z.preprocess((val) => Number(val), z.number()),
        tenantId: z.preprocess((val) => Number(val), z.number()),
        value: z.preprocess((val) => Number(val), z.number().min(1)),
        dueDay: z.preprocess((val) => Number(val), z.number().min(1).max(31)),
        garantiaValor: z.preprocess((val) => (val ? Number(val) : 0), z.number().optional()),
        inicioCobranca: z.coerce.date().optional(),
      })
    ),
    defaultValues: leaseToEdit
      ? {
          ...leaseToEdit,
          // Convertimos strings a números para que el formulario no de error
          value: Number(leaseToEdit.value) as any,
          garantiaValor: Number(leaseToEdit.garantiaValor || 0) as any,
          startDate: new Date(leaseToEdit.startDate),
          endDate: new Date(leaseToEdit.endDate),
          inicioCobranca: leaseToEdit.inicioCobranca ? new Date(leaseToEdit.inicioCobranca) : undefined,
        }
      : {
          value: 0 as any,
          dueDay: 5,
          adjustmentIndex: "IPCA",
          status: "ACTIVE",
          garantiaTipo: "Caução",
          garantiaValor: 0 as any,
        },
  });

  const onSubmit = (data: InsertLease) => {
    const payload = {
      ...data,
      value: data.value.toString(),
      garantiaValor: data.garantiaValor?.toString() || "0",
    };

    if (leaseToEdit) {
      updateLease(
        { id: leaseToEdit.id, data: payload as any },
        {
          onSuccess: () => {
            toast({ title: "Contrato atualizado!" });
            onSuccess();
          },
        }
      );
    } else {
      createLease(payload as any, {
        onSuccess: () => {
          toast({ title: "Contrato criado!" });
          onSuccess();
        },
      });
    }
  };

  const selectedGarantia = form.watch("garantiaTipo");

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
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {properties?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.address}
                      </SelectItem>
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
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tenants?.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
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
                <FormLabel>Início do Contrato</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
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
                <FormLabel>Término do Contrato</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="adjustmentIndex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Índice de Reajuste</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
          <FormField
            control={form.control}
            name="garantiaTipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Garantia</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Caução">Caução (Depósito)</SelectItem>
                    <SelectItem value="Seguro Fiança">Seguro Fiança</SelectItem>
                    <SelectItem value="Fiador">Fiador</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedGarantia === "Caução" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-lg border border-amber-100 mt-2">
            <div className="col-span-full">
              <p className="text-xs font-semibold text-amber-700 uppercase">Configuração de Depósito</p>
            </div>
            <FormField
              control={form.control}
              name="garantiaValor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-800 font-medium">Valor Recebido (R$)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="Ex: 4500" className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inicioCobranca"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-800 font-medium">Início das Cobranças</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-white"
                      value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <p className="text-[10px] text-amber-600 mt-1 leading-tight">
                    Primeiro boleto será gerado nesta data via Asaas.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {leaseToEdit ? "Salvar Alterações" : "Criar Contrato"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
