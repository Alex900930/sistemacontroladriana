import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertOwner } from "@shared/schema";

export function useOwners() {
  return useQuery({
    queryKey: [api.owners.list.path],
    queryFn: async () => {
      const res = await fetch(api.owners.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar proprietários");
      return api.owners.list.responses[200].parse(await res.json());
    },
  });
}

export function useOwner(id: number) {
  return useQuery({
    queryKey: [api.owners.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.owners.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar proprietário");
      return api.owners.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertOwner) => {
      const res = await fetch(api.owners.create.path, {
        method: api.owners.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao criar proprietário");
      return api.owners.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.owners.list.path] }),
  });
}

export function useUpdateOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertOwner>) => {
      const url = buildUrl(api.owners.update.path, { id });
      const res = await fetch(url, {
        method: api.owners.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao atualizar proprietário");
      return api.owners.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.owners.list.path] }),
  });
}

export function useDeleteOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.owners.delete.path, { id });
      const res = await fetch(url, { 
        method: api.owners.delete.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Falha ao excluir proprietário");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.owners.list.path] }),
  });
}
