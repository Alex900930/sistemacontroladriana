import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useOwners, useCreateOwner, useDeleteOwner, useUpdateOwner } from "@/hooks/use-owners";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Pencil, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { insertOwnerSchema, type InsertOwner, type Owner } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

export default function Owners() {
  const { data: owners, isLoading } = useOwners();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  
  const filteredOwners = owners?.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (owner: Owner) => {
    setEditingOwner(owner);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingOwner(null);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Proprietários</h1>
          <p className="text-slate-500 mt-1">Gerencie os proprietários dos imóveis</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
          <Plus className="mr-2 h-4 w-4" /> Novo Proprietário
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome ou email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 focus:ring-blue-500"
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
                <TableHead>Conta Asaas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOwners?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    Nenhum proprietário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOwners?.map((owner) => (
                  <OwnerRow key={owner.id} owner={owner} onEdit={handleEdit} />
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOwner ? 'Editar Proprietário' : 'Novo Proprietário'}</DialogTitle>
          </DialogHeader>
          <OwnerForm 
            onSuccess={handleClose} 
            initialData={editingOwner || undefined}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function OwnerRow({ owner, onEdit }: { owner: Owner, onEdit: (o: Owner) => void }) {
  const { mutate: deleteOwner, isPending } = useDeleteOwner();
  const { toast } = useToast();

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este proprietário?')) {
      deleteOwner(owner.id, {
        onSuccess: () => toast({ title: "Proprietário excluído com sucesso!" }),
        onError: () => toast({ title: "Erro ao excluir proprietário", variant: "destructive" })
      });
    }
  };

  return (
    <TableRow className="hover:bg-slate-50/80 transition-colors">
      <TableCell className="font-medium text-slate-900">{owner.name}</TableCell>
      <TableCell>{owner.email}</TableCell>
      <TableCell>{owner.cpfCnpj}</TableCell>
      <TableCell>
        {owner.asaasSubaccountId ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Conectado
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            Pendente
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(owner)}>
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

function OwnerForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: Owner }) {
  const { mutate: createOwner, isPending: isCreating } = useCreateOwner();
  const { mutate: updateOwner, isPending: isUpdating } = useUpdateOwner();
  const { toast } = useToast();

  const form = useForm<InsertOwner>({
    resolver: zodResolver(insertOwnerSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      cpfCnpj: "",
      bankInfo: "",
      asaasSubaccountId: null,
    },
  });

  const onSubmit = (data: InsertOwner) => {
    if (initialData) {
      updateOwner({ id: initialData.id, ...data }, {
        onSuccess: () => {
          toast({ title: "Proprietário atualizado!" });
          onSuccess();
        },
        onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" })
      });
    } else {
      createOwner(data, {
        onSuccess: () => {
          toast({ title: "Proprietário criado!" });
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
                <Input {...field} placeholder="Ex: João da Silva" />
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
                  <Input {...field} type="email" placeholder="joao@email.com" />
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
          name="bankInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Informações Bancárias (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="Banco, Agência, Conta..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isCreating || isUpdating} className="bg-blue-600">
            {isCreating || isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {initialData ? 'Salvar Alterações' : 'Criar Proprietário'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
