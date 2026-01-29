import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty } from "@/hooks/use-properties";
import { useOwners } from "@/hooks/use-owners";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Pencil, Loader2, Home } from "lucide-react";
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
import { insertPropertySchema, type InsertProperty, type PropertyWithDetails } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

export default function Properties() {
  const { data: properties, isLoading } = useProperties();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyWithDetails | null>(null);

  const filtered = properties?.filter(p => 
    p.address.toLowerCase().includes(search.toLowerCase()) ||
    p.owner.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (prop: PropertyWithDetails) => {
    setEditingProperty(prop);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingProperty(null);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Imóveis</h1>
          <p className="text-slate-500 mt-1">Gerencie seu portfólio de propriedades</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
          <Plus className="mr-2 h-4 w-4" /> Novo Imóvel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por endereço ou proprietário..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-md bg-white border-slate-200"
            />
        </div>

        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
            Nenhum imóvel encontrado.
          </div>
        ) : (
          filtered?.map((prop) => (
            <PropertyCard key={prop.id} property={prop} onEdit={handleEdit} />
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Editar Imóvel' : 'Novo Imóvel'}</DialogTitle>
          </DialogHeader>
          <PropertyForm 
            onSuccess={handleClose} 
            initialData={editingProperty || undefined}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function PropertyCard({ property, onEdit }: { property: PropertyWithDetails, onEdit: (p: PropertyWithDetails) => void }) {
  const { mutate: deleteProp, isPending } = useDeleteProperty();
  const { toast } = useToast();

  const handleDelete = () => {
    if (confirm('Excluir este imóvel?')) {
      deleteProp(property.id, {
        onSuccess: () => toast({ title: "Imóvel excluído!" }),
        onError: () => toast({ title: "Erro ao excluir", variant: "destructive" })
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-40 bg-slate-100 flex items-center justify-center relative">
        {/* Placeholder image - in a real app would be dynamic */}
        <Home className="h-12 w-12 text-slate-300" />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
           <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90" onClick={() => onEdit(property)}>
             <Pencil className="h-4 w-4 text-slate-600" />
           </Button>
           <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleDelete} disabled={isPending}>
             <Trash2 className="h-4 w-4" />
           </Button>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{property.address}</h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[40px]">{property.description || "Sem descrição"}</p>
        
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
          <span className="text-slate-500">Proprietário:</span>
          <span className="font-medium text-blue-600">{property.owner.name}</span>
        </div>
      </div>
    </div>
  );
}

function PropertyForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: PropertyWithDetails }) {
  const { data: owners } = useOwners();
  const { mutate: createProp, isPending: isCreating } = useCreateProperty();
  const { mutate: updateProp, isPending: isUpdating } = useUpdateProperty();
  const { toast } = useToast();

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: initialData ? {
      address: initialData.address,
      description: initialData.description,
      ownerId: initialData.ownerId,
    } : {
      address: "",
      description: "",
      ownerId: 0,
    },
  });

  const onSubmit = (data: InsertProperty) => {
    // Ensure ownerId is a number
    data.ownerId = Number(data.ownerId);

    if (initialData) {
      updateProp({ id: initialData.id, ...data }, {
        onSuccess: () => {
          toast({ title: "Imóvel atualizado!" });
          onSuccess();
        },
        onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" })
      });
    } else {
      createProp(data, {
        onSuccess: () => {
          toast({ title: "Imóvel criado!" });
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
          name="ownerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proprietário</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value ? String(field.value) : undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um proprietário" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {owners?.map(owner => (
                    <SelectItem key={owner.id} value={String(owner.id)}>
                      {owner.name}
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço Completo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Rua, Número, Bairro..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="Apartamento, 3 quartos..." />
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
