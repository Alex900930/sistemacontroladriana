import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { db } from "./db"; // For seed only
import { owners, properties, tenants, leases, payments } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

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

  app.post(api.owners.create.path, async (req, res) => {
    try {
      const input = api.owners.create.input.parse(req.body);
      const result = await storage.createOwner(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ message: err.errors[0].message });
      else throw err;
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
      const result = await storage.createTenant(input);
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

  app.post(api.leases.create.path, async (req, res) => {
    try {
      const input = api.leases.create.input.parse(req.body);
      const result = await storage.createLease(input);
      // MOCK ASAAS INTEGRATION:
      // In a real app, we would call Asaas API here to create the subscription
      // and update the lease with asaasSubscriptionId.
      const mockAsaasId = `sub_${Math.random().toString(36).substr(2, 9)}`;
      await storage.updateLeaseAsaasId(result.id, mockAsaasId);
      
      res.status(201).json({ ...result, asaasSubscriptionId: mockAsaasId });
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

  // === PAYMENTS ===
  app.get(api.payments.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const result = await storage.getPayments(status);
    res.json(result);
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
    console.log("Asaas Webhook:", event);
    
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

  console.log("Seeding database...");
  
  // Create Owner
  const owner = await storage.createOwner({
    name: "Adriana Silva",
    email: "adriana@example.com",
    cpfCnpj: "123.456.789-00",
    bankInfo: "Banco do Brasil, Ag 1234, CC 56789-0"
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

  console.log("Database seeded successfully!");
}
