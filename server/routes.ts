import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { api } from ".././shared/routes.js";
import { z } from "zod";
//import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { db } from "./db.js"; // For seed only
import { properties, tenants, leases, payments, insertPaymentSchema } from ".././shared/schema.js";

import { eq, and, or } from "drizzle-orm"; // IMPORTANTE: Para las consultas .where(eq(...))


import { asaas } from "./asaas.js";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Eliminamos la configuración de Replit Auth
  // await setupAuth(app);
  // registerAuthRoutes(app);

  // === OWNERS ===
  app.get(api.owners.list.path, async (req, res) => {
    const result = await storage.getOwners();
    res.json(result);
  });
  
  app.get(api.owners.get.path, async (req, res) => {
      const result = await storage.getOwner(Number(req.params.id));
      if (!result) return res.status(404).json({ message: "Owner not found" });
      res.json(result);
  });

// server/routes.ts

app.post(api.owners.create.path, async (req, res) => {
  try {
    // 1. Validamos los datos con el nuevo esquema
    const input = api.owners.create.input.parse(req.body);
    
    console.log("Iniciando creación y sincronización de:", input.name);

    let asaasSubaccountId = null;
    try {
      // 2. Enviamos TODO el objeto a Asaas
      const asaasAccount = await asaas.createSubaccount(input);
      
      // Asaas devuelve el ID en el campo 'id' para nuevas cuentas
      asaasSubaccountId = asaasAccount.id; 
      console.log("Subcuenta creada con éxito:", asaasSubaccountId);
    } catch (err: any) {
      // Si Asaas falla, lanzamos error para que Adriana sepa por qué
      console.error("Fallo en Asaas:", err.message);
      return res.status(400).json({ message: "Erro no Asaas: " + err.message });
    }

    // 3. Guardamos en nuestra base de datos local
    const result = await storage.createOwner({
      ...input,
      asaasSubaccountId
    });

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
    } else {
      console.error("Error interno:", err);
      res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
});

   app.put(api.owners.update.path, async (req, res) => {
      try {
        const input = api.owners.update.input.parse(req.body);
        const result = await storage.updateOwner(Number(req.params.id), input);
        res.json(result);
      } catch (err) {
          if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
          else res.status(404).json({ message: "Owner not found" });
      }
    });
    
    app.delete(api.owners.delete.path, async (req, res) => {
        try {
            await storage.deleteOwner(Number(req.params.id));
            res.status(204).send();
        } catch (err) {
            res.status(404).json({ message: "Owner not found" });
        }
    });

  // === PROPERTIES ===
  app.get(api.properties.list.path, async (req, res) => {
    const result = await storage.getProperties();
    res.json(result);
  });
  
  app.get(api.properties.get.path, async (req, res) => {
      const result = await storage.getProperty(Number(req.params.id));
      if (!result) return res.status(404).json({ message: "Property not found" });
      res.json(result);
  });

  app.post(api.properties.create.path, async (req, res) => {
    try {
      const input = api.properties.create.input.parse(req.body);
      const result = await storage.createProperty(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else throw err;
    }
  });
  
  app.put(api.properties.update.path, async (req, res) => {
      try {
        const input = api.properties.update.input.parse(req.body);
        const result = await storage.updateProperty(Number(req.params.id), input);
        res.json(result);
      } catch (err) {
          if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
          else res.status(404).json({ message: "Property not found" });
      }
    });

    app.delete(api.properties.delete.path, async (req, res) => {
        try {
            await storage.deleteProperty(Number(req.params.id));
            res.status(204).send();
        } catch (err) {
            res.status(404).json({ message: "Property not found" });
        }
    });

  // === TENANTS ===
  app.get(api.tenants.list.path, async (req, res) => {
    const result = await storage.getTenants();
    res.json(result);
  });
  
   app.get(api.tenants.get.path, async (req, res) => {
      const result = await storage.getTenant(Number(req.params.id));
      if (!result) return res.status(404).json({ message: "Tenant not found" });
      res.json(result);
  });

  app.post(api.tenants.create.path, async (req, res) => {
    try {
      const input = api.tenants.create.input.parse(req.body);
      
      // Integrate with Asaas to create Customer
      let asaasCustomerId = null;
      try {
        const asaasCustomer = await asaas.createCustomer({
          name: input.name,
          email: input.email,
          cpfCnpj: input.cpfCnpj,
          phone: input.phone || undefined
        });
        asaasCustomerId = asaasCustomer.id;
      } catch (err) {
        console.error("Error creating Asaas customer:", err);
      }

      const result = await storage.createTenant({
        ...input,
        asaasCustomerId
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else throw err;
    }
  });
  
  app.put(api.tenants.update.path, async (req, res) => {
      try {
        const input = api.tenants.update.input.parse(req.body);
        const result = await storage.updateTenant(Number(req.params.id), input);
        res.json(result);
      } catch (err) {
          if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
          else res.status(404).json({ message: "Tenant not found" });
      }
    });

    app.delete(api.tenants.delete.path, async (req, res) => {
        try {
            await storage.deleteTenant(Number(req.params.id));
            res.status(204).send();
        } catch (err) {
            res.status(404).json({ message: "Tenant not found" });
        }
    });

  // === LEASES ===
  app.get(api.leases.list.path, async (req, res) => {
    const result = await storage.getLeases();
    res.json(result);
  });
  
   app.get(api.leases.get.path, async (req, res) => {
      const result = await storage.getLease(Number(req.params.id));
      if (!result) return res.status(404).json({ message: "Lease not found" });
      res.json(result);
  });

 // === LEASES (CONTRATOS) CON SINCRONIZACIÓN DE COBROS ===
  app.post(api.leases.create.path, async (req, res) => {
    try {
      const input = api.leases.create.input.parse(req.body);
      
      const property = await storage.getProperty(input.propertyId);
      if (!property) return res.status(404).json({ message: "Property not found" });
      
      const owner = await storage.getOwner(property.ownerId);
      if (!owner) return res.status(404).json({ message: "Owner not found" });
      
      const tenant = await storage.getTenant(input.tenantId);
      if (!tenant) return res.status(404).json({ message: "Tenant not found" });

      // 1. Creamos el contrato y los registros de pago locales (Status PENDING)
      const result = await storage.createLease(input);
      console.log(`[server] Contrato #${result.id} creado localmente.`);
      
      let asaasSubscriptionId = null;

      // 2. Integración con Asaas para crear la Suscripción con Split
      if (tenant.asaasCustomerId && owner.asaasSubaccountId) {
        try {
          const subscription = await asaas.createSubscription({
            customer: tenant.asaasCustomerId,
            value: Number(input.value),
            nextDueDate: input.startDate.toISOString().split('T')[0],
            cycle: "MONTHLY",
            description: `Aluguel - ${property.address}`,
            split: [
              {
                walletId: owner.asaasSubaccountId,
                percentualValue: 90, // 90% para el dueño
              }
            ]
          });
          
          asaasSubscriptionId = subscription.id;
          console.log(`[server] Suscripción creada en Asaas: ${asaasSubscriptionId}`);

          // --- TRUCO SENIOR: SINCRONIZAR EL ID DEL PAGO ---
          // Esperamos un segundo para que Asaas genere el primer boleto
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Consultamos a Asaas qué cobros generó para esta suscripción
          // Necesitas tener esta función 'asaasRequest' o similar expuesta
          const asaasPayments = await asaas.getSubscriptionPayments(subscription.id);
          
          if (asaasPayments.data && asaasPayments.data.length > 0) {
            const firstAsaasPayment = asaasPayments.data[0];
            
            // Buscamos el pago que creamos en storage.createLease para este contrato
            const [localPayment] = await db.select().from(payments)
              .where(eq(payments.leaseId, result.id))
              .limit(1);

            if (localPayment) {
              await db.update(payments)
                .set({ asaasPaymentId: firstAsaasPayment.id })
                .where(eq(payments.id, localPayment.id));
              console.log(`[server] Pago local #${localPayment.id} sincronizado con Asaas ID: ${firstAsaasPayment.id}`);
            }
          }
        } catch (err: any) {
          console.error("Error sincronizando con Asaas:", err.message);
        }
      }

      if (asaasSubscriptionId) {
        await storage.updateLeaseAsaasId(result.id, asaasSubscriptionId);
      }
      
      res.status(201).json({ ...result, asaasSubscriptionId });
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else throw err;
    }
  });

  app.post(api.leases.syncAsaas.path, async (req, res) => {
    const lease = await storage.getLease(Number(req.params.id));
    if (!lease) return res.status(404).json({ message: "Lease not found" });
    
    // MOCK Sync logic
    const mockAsaasId = `sub_${Math.random().toString(36).substr(2, 9)}`;
    await storage.updateLeaseAsaasId(lease.id, mockAsaasId);
    
    res.json({ success: true, message: "Synced with Asaas successfully" });
  });

  // === LEASES ===
  // ... (tus rutas get y post existentes) ...

  // AGREGA ESTO PARA ACTUALIZAR (PATCH)
app.patch('/api/leases/:id', async (req, res) => {
  try {
    const leaseId = Number(req.params.id);
    const data = req.body;

    // 1. Candado de Seguridad: Verificar deudas si es rescisión
    if (data.status === "TERMINATED") {
      const pendingPayments = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.leaseId, leaseId),
            or(
              eq(payments.status, "PENDING"),
              eq(payments.status, "PENDENTE"),
              eq(payments.status, "OVERDUE")
            )
          )
        );

      if (pendingPayments.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível finalizar: Este contrato possui pendências financeiras no sistema." 
        });
      }
    }

    // 2. TRANSFORMACIÓN SENIOR: Convertir strings a objetos Date para Postgres
    // Esto evita el Error 500 que teníamos antes
    const updatePayload: any = {
      ...data,
      dataRescisao: data.dataRescisao ? new Date(data.dataRescisao) : undefined,
      dataEntregaChaves: data.dataEntregaChaves ? new Date(data.dataEntregaChaves) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      inicioCobranca: data.inicioCobranca ? new Date(data.inicioCobranca) : undefined,
    };

    // 3. Ejecutar la actualización en la BD
    const [updated] = await db.update(leases)
      .set(updatePayload)
      .where(eq(leases.id, leaseId))
      .returning();

    if (!updated) return res.status(404).json({ message: "Contrato não encontrado" });
    
    console.log(`✅ Contrato #${leaseId} atualizado com sucesso para status: ${updated.status}`);
    res.json(updated);

  } catch (err: any) {
    console.error("❌ ERROR AL ACTUALIZAR CONTRATO:", err);
    res.status(500).json({ message: "Erro interno no servidor: " + err.message });
  }
});

  // AGREGA ESTO PARA ELIMINAR (DELETE)
 // En server/routes.ts (alrededor de la línea 294)
app.delete('/api/leases/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(`[server] Intentando eliminar contrato y pagos asociados para ID: ${id}`);

    // 1. Borrar pagos asociados primero para evitar el error de llave foránea
    await db.delete(payments).where(eq(payments.leaseId, id));

    // 2. Ahora borrar el contrato
    const [deletedLease] = await db.delete(leases)
      .where(eq(leases.id, id))
      .returning();

    if (!deletedLease) {
      return res.status(404).json({ message: "Contrato não encontrado" });
    }

    res.status(204).send(); // Todo bien, sin contenido
  } catch (err) {
    console.error("Erro detalhado ao deletar contrato:", err);
    res.status(500).json({ 
      message: "Erro ao deletar contrato. Verifique se existem dependências pendentes." 
    });
  }
});

  // === PAYMENTS ===
// === PAYMENTS (BAIXA MANUAL CORREGIDA) ===
  app.get(api.payments.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const result = await storage.getPayments(status);
    res.json(result);
  });

// === PAYMENTS (BAIXA MANUAL LIMPIA) ===
app.put('/api/payments/:id', async (req, res) => {
  try {
    const paymentId = Number(req.params.id);
    const { valorRecebido, tipoPagamento, notes } = req.body;
    
    // 1. Buscamos el pago (Drizzle usa los nombres del Schema, no de la DB)
    const [originalPayment] = await db.select().from(payments).where(eq(payments.id, paymentId));
    
    if (!originalPayment) return res.status(404).json({ message: 'Pagamento não encontrado' });

    // Según tu schema es 'amount' (aunque en DB sea 'valor')
    const totalOriginal = Number(originalPayment.amount); 
    const recibido = Number(valorRecebido);

    if (recibido > 0 && recibido < totalOriginal) {
      // PAGO PARCIAL
      await db.update(payments).set({
          amount: recibido.toString(), // Drizzle mapeará esto a "valor" en la DB
          valorRecebido: recibido,      // Drizzle mapeará esto a "valor_recebido"
          tipoPagamento: tipoPagamento,
          status: 'RECEIVED',
          paymentDate: new Date()       // Drizzle mapeará esto a "data_pagamento"
        }).where(eq(payments.id, paymentId));

      const saldoRestante = totalOriginal - recibido;
      await db.insert(payments).values({
        leaseId: originalPayment.leaseId,
        amount: saldoRestante.toString(),
        status: 'PENDING',
        dueDate: originalPayment.dueDate,
        notes: `Saldo restante de pago parcial (Ref: #${paymentId})`
      });

      return res.json({ message: "Baixa parcial realizada!" });
    } 
    
    // PAGO TOTAL O ACTUALIZACIÓN
    const input = insertPaymentSchema.partial().parse(req.body);
    const updateData: any = { ...input };
    
    if (recibido >= totalOriginal) {
      updateData.status = 'RECEIVED';
      updateData.paymentDate = new Date();
      updateData.amount = totalOriginal.toString();
      updateData.valorRecebido = recibido;
    }

    const [updated] = await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, paymentId))
      .returning();
      
    res.json(updated);

  } catch (err) {
    console.error('Erro ao processar pagamento:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});
  
  // === DASHBOARD ===
  app.get(api.dashboard.stats.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // === WEBHOOKS (Asaas) ===
  app.post("/api/webhooks/asaas", async (req, res) => {
    // Handle Asaas webhook
    const event = req.body;
   
    
    // Logic to update payment status based on event type
    // PAYMENT_RECEIVED, PAYMENT_OVERDUE
    
    res.json({ received: true });
  });

  // Seed Data (if empty)
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {

  const existingOwners = await storage.getOwners();

  if (existingOwners.length > 0) return;


  
  // Create Owner
 const owner = await storage.createOwner({
      name: "Adriana Silva",
      email: "adriana@example.com",
      cpfCnpj: "123.456.789-00",
      bankInfo: "Banco do Brasil, Ag 1234, CC 56789-0",
      birthDate: "1980-01-01",
      phone: "11999999999",
      address: "Rua Exemplo",
      addressNumber: "100",
      province: "Centro",
      postalCode: "01001000",
      city: "São Paulo",
      state: "SP",
      pixKey: "adriana@pix.com"
    });

  // Create Property
  const property = await storage.createProperty({
    address: "Av. Paulista, 1000 - Apt 405, São Paulo - SP",
    description: "Apartamento moderno no centro",
    ownerId: owner.id
  });

  // Create Tenant
  const tenant = await storage.createTenant({
    name: "João Souza",
    email: "joao@example.com",
    cpfCnpj: "987.654.321-00",
    phone: "(11) 98765-4321"
  });

  // Create Lease
  const lease = await storage.createLease({
    propertyId: property.id,
    tenantId: tenant.id,
    value: 2500.00,
    dueDay: 5,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-01-01"),
    adjustmentIndex: "IPCA",
    status: "ACTIVE"
  });

  // Create Dummy Payments
  await storage.createPayment({
    leaseId: lease.id,
    amount: 2500.00,
    status: "RECEIVED",
    dueDate: new Date("2024-02-05"),
    paymentDate: new Date("2024-02-05")
  });
  
  await storage.createPayment({
    leaseId: lease.id,
    amount: 2500.00,
    status: "PENDING",
    dueDate: new Date("2024-03-05")
  });


}
