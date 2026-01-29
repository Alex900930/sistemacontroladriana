import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTenant } from "@shared/schema";

export function useTenants() {
  return useQuery({
    queryKey: [api.tenants.list.path],
    queryFn: async () => {
      const res = await fetch(api.tenants.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar inquilinos");
      return api.tenants.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTenant) => {
      const res = await fetch(api.tenants.create.path, {
        method: api.tenants.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao criar inquilino");
      return api.tenants.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.tenants.list.path] }),
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertTenant>) => {
      const url = buildUrl(api.tenants.update.path, { id });
      const res = await fetch(url, {
        method: api.tenants.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao atualizar inquilino");
      return api.tenants.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.tenants.list.path] }),
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tenants.delete.path, { id });
      const res = await fetch(url, { method: api.tenants.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Falha ao excluir inquilino");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.tenants.list.path] }),
  });
}
