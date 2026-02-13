import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertPayment } from "@shared/schema";

export function usePayments(status?: 'PENDING' | 'RECEIVED' | 'OVERDUE') {
  return useQuery({
    queryKey: [api.payments.list.path, status],
    queryFn: async () => {
      let url = api.payments.list.path;
      if (status) {
        url = `${url}?status=${status}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar pagamentos");
      return api.payments.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPayment> }) => {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Falha ao atualizar pagamento');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.payments.list.path] }),
  });
}
