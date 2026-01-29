import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertLease } from "@shared/schema";

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

export function useSyncAsaas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.leases.syncAsaas.path, { id });
      const res = await fetch(url, { 
        method: api.leases.syncAsaas.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Falha ao sincronizar com Asaas");
      return api.leases.syncAsaas.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.leases.list.path] }),
  });
}
