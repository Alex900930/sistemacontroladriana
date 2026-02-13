import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant } from "@/hooks/use-tenants";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Pencil, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTenantSchema, type InsertTenant, type Tenant } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

export default function Tenants() {
  const { data: tenants, isLoading } = useTenants();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const filtered = tenants?.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingTenant(null);
  };

  return (
    <DashboardLayout>
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
         <h1 className="text-2xl font-bold">Inquilinos</h1>
         <Input
           placeholder="Pesquisar inquilinos..."
           value={search}
           onChange={(e) => setSearch(e.target.value)}
         />
         <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
          <Plus className="mr-2 h-4 w-4" /> Adicionar Inquilino
        </Button>
       </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-slate-50/50">
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    Nenhum inquilino encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered?.map((tenant) => (
                  <TenantRow key={tenant.id} tenant={tenant} onEdit={handleEdit} />
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTenant ? 'Editar Inquilino' : 'Novo Inquilino'}</DialogTitle>
          </DialogHeader>
          <TenantForm 
            onSuccess={handleClose} 
            initialData={editingTenant || undefined}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function TenantRow({ tenant, onEdit }: { tenant: Tenant, onEdit: (t: Tenant) => void }) {
    const { mutate: deleteTenant, isPending } = useDeleteTenant();
    const { toast } = useToast();
  
    const handleDelete = () => {
      if (confirm('Excluir este inquilino?')) {
        deleteTenant(tenant.id, {
          onSuccess: () => toast({ title: "Excluído com sucesso!" }),
          onError: () => toast({ title: "Erro ao excluir", variant: "destructive" })
        });
      }
    };
  
    return (
      <TableRow className="hover:bg-slate-50/80 transition-colors">
        <TableCell className="font-medium text-slate-900">{tenant.name}</TableCell>
        <TableCell>{tenant.email}</TableCell>
        <TableCell>{tenant.cpfCnpj}</TableCell>
        <TableCell>{tenant.phone || '-'}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(tenant)}>
              <Pencil className="h-4 w-4 text-slate-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
}

function TenantForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: Tenant }) {
  const { mutate: createTenant, isPending: isCreating } = useCreateTenant();
  const { mutate: updateTenant, isPending: isUpdating } = useUpdateTenant();
  const { toast } = useToast();

  const form = useForm<InsertTenant>({
    resolver: zodResolver(insertTenantSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      cpfCnpj: "",
      phone: "",
      asaasCustomerId: null,
    },
  });

  const onSubmit = (data: InsertTenant) => {
    if (initialData) {
      updateTenant({ id: initialData.id, ...data }, {
        onSuccess: () => {
          toast({ title: "Atualizado!" });
          onSuccess();
        },
        onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" })
      });
    } else {
      createTenant(data, {
        onSuccess: () => {
          toast({ title: "Criado!" });
          onSuccess();
        },
        onError: () => toast({ title: "Erro ao criar", variant: "destructive" })
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Maria Oliveira" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="maria@email.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpfCnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF/CNPJ</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="000.000.000-00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="(00) 00000-0000" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isCreating || isUpdating} className="bg-blue-600">
            {isCreating || isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {initialData ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
