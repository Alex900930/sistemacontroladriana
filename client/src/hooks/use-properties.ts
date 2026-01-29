import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProperty } from "@shared/schema";

export function useProperties() {
  return useQuery({
    queryKey: [api.properties.list.path],
    queryFn: async () => {
      const res = await fetch(api.properties.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar imóveis");
      return api.properties.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProperty) => {
      const res = await fetch(api.properties.create.path, {
        method: api.properties.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao criar imóvel");
      return api.properties.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.properties.list.path] }),
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertProperty>) => {
      const url = buildUrl(api.properties.update.path, { id });
      const res = await fetch(url, {
        method: api.properties.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao atualizar imóvel");
      return api.properties.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.properties.list.path] }),
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.properties.delete.path, { id });
      const res = await fetch(url, { method: api.properties.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Falha ao excluir imóvel");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.properties.list.path] }),
  });
}
