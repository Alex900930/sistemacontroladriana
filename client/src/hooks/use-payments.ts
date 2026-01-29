import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

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
