const ASAAS_API_URL = "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

async function asaasRequest(endpoint: string, method: string = "GET", body?: any) {
  if (!ASAAS_API_KEY) {
    throw new Error("ASAAS_API_KEY is not configured");
  }

  const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Asaas API Error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

export const asaas = {
  // Customers (Tenants in our ERP)
  createCustomer: async (tenant: { name: string; cpfCnpj: string; email: string; phone?: string }) => {
    return asaasRequest("/customers", "POST", {
      name: tenant.name,
      cpfCnpj: tenant.cpfCnpj.replace(/\D/g, ""),
      email: tenant.email,
      mobilePhone: tenant.phone?.replace(/\D/g, ""),
    });
  },

  // Función para obtener los cobros generados por una suscripción
getSubscriptionPayments: async (subscriptionId: string) => {
  // Asegúrate de que esta ruta coincida con el método asaasRequest que ya tienes
  return asaasRequest(`/subscriptions/${subscriptionId}/payments`, "GET");
},

  // Subaccounts (Owners in our ERP - for Split)
// server/asaas.ts

// server/asaas.ts

createSubaccount: async (owner: any) => {
  const cleanCpfCnpj = owner.cpfCnpj.replace(/\D/g, "");
  const isCnpj = cleanCpfCnpj.length > 11;

  return asaasRequest("/accounts", "POST", {
    name: owner.name,
    email: owner.email,
    cpfCnpj: cleanCpfCnpj,
    birthDate: owner.birthDate,
    phone: owner.phone?.replace(/\D/g, ""),
    mobilePhone: owner.phone?.replace(/\D/g, ""),
    incomeValue: 5000,
    // Bloque de dirección exigido por Asaas
    address: owner.address,
    addressNumber: owner.addressNumber,
    province: owner.province,
    postalCode: owner.postalCode?.replace(/\D/g, ""),
    companyType: isCnpj ? "LIMITED" : "INDIVIDUAL",
     city: owner.city, // <--- AÑADIR ESTO
    state: owner.state, // <--- AÑADIR ESTO (UF)
  });
},
  // Subscriptions (Leases in our ERP)
  createSubscription: async (params: {
    customer: string;
    value: number;
    nextDueDate: string;
    cycle: "MONTHLY";
    description: string;
    split: { walletId: string; fixedValue?: number; percentualValue?: number }[];
  }) => {
    return asaasRequest("/subscriptions", "POST", {
      customer: params.customer,
      billingType: "BOLETO",
      value: params.value,
      nextDueDate: params.nextDueDate,
      cycle: "MONTHLY",
      description: params.description,
      split: params.split,
    });
  },
};
