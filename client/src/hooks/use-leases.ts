import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertLease } from "@shared/schema";

// 1. OBTENER LISTA DE CONTRATOS
export function useLeases() {
  return useQuery({
    queryKey: [api.leases.list.path],
    queryFn: async () => {
      const res = await fetch(api.leases.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar contratos");
      return api.leases.list.responses[200].parse(await res.json());
    },
  });
}

// 2. CREAR CONTRATO
export function useCreateLease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertLease) => {
      const res = await fetch(api.leases.create.path, {
        method: api.leases.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao criar contrato");
      return api.leases.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.leases.list.path] }),
  });
}

// 3. SINCRONIZAR CON ASAAS
export function useSyncAsaas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.leases.syncAsaas.path, { id });
      const res = await fetch(url, { 
        method: api.leases.syncAsaas.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Falha ao sincronizar con Asaas");
      return api.leases.syncAsaas.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.leases.list.path] }),
  });
}

// 4. ACTUALIZAR CONTRATO (CORREGIDO)
// use-leases.ts

export function useUpdateLease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/leases/${id}`, { // Usamos la URL manual directamente
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao atualizar contrato");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leases.list.path] });
    },
  });
}

export function useDeleteLease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/leases/${id}`, { // URL manual para evitar el error de 'api.leases.delete'
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Erro ao excluir contrato");
      
      if (res.status === 204) return true;
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leases.list.path] });
    },
  });
}