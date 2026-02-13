import { 
  owners, properties, tenants, leases, payments,
  type Owner, type InsertOwner,
  type Property, type InsertProperty,
  type Tenant, type InsertTenant,
  type Lease, type InsertLease,
  type Payment, type InsertPayment
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Owners
  getOwners(): Promise<Owner[]>;
  getOwner(id: number): Promise<Owner | undefined>;
  createOwner(owner: InsertOwner): Promise<Owner>;
  updateOwner(id: number, owner: Partial<InsertOwner>): Promise<Owner>;
  deleteOwner(id: number): Promise<void>;

  // Properties
  getProperties(): Promise<(Property & { owner: Owner })[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property>;
  deleteProperty(id: number): Promise<void>;

  // Tenants
  getTenants(): Promise<Tenant[]>;
  getTenant(id: number): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant>;
  deleteTenant(id: number): Promise<void>;

  // Leases
  getLeases(): Promise<(Lease & { property: Property; tenant: Tenant })[]>;
  getLease(id: number): Promise<Lease | undefined>;
  createLease(lease: InsertLease): Promise<Lease>;
  updateLeaseAsaasId(id: number, asaasId: string): Promise<Lease>; // Specific update
  
  // Payments
  getPayments(status?: string): Promise<(Payment & { lease: Lease })[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: string, paymentDate?: Date): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  
  // Dashboard
  getDashboardStats(): Promise<{
    totalProperties: number;
    totalTenants: number;
    activeLeases: number;
    pendingPaymentsAmount: number;
    receivedPaymentsAmount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Owners
  // En server/storage.ts
async getOwners(): Promise<Owner[]> {
  return await db.select().from(owners);
}

  async getOwner(id: number): Promise<Owner | undefined> {
    const [owner] = await db.select().from(owners).where(eq(owners.id, id));
    return owner;
  }

  async createOwner(insertOwner: InsertOwner): Promise<Owner> {
    const [owner] = await db.insert(owners).values(insertOwner).returning();
    return owner;
  }
  
  async updateOwner(id: number, update: Partial<InsertOwner>): Promise<Owner> {
      const [owner] = await db.update(owners).set(update).where(eq(owners.id, id)).returning();
      return owner;
  }
  
  async deleteOwner(id: number): Promise<void> {
      await db.delete(owners).where(eq(owners.id, id));
  }

  // Properties
  async getProperties(): Promise<(Property & { owner: Owner })[]> {
    return await db.query.properties.findMany({
      with: { owner: true }
    });
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }

   async updateProperty(id: number, update: Partial<InsertProperty>): Promise<Property> {
      const [property] = await db.update(properties).set(update).where(eq(properties.id, id)).returning();
      return property;
  }
  
  async deleteProperty(id: number): Promise<void> {
      await db.delete(properties).where(eq(properties.id, id));
  }

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants);
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(insertTenant).returning();
    return tenant;
  }
  
   async updateTenant(id: number, update: Partial<InsertTenant>): Promise<Tenant> {
      const [tenant] = await db.update(tenants).set(update).where(eq(tenants.id, id)).returning();
      return tenant;
  }
  
  async deleteTenant(id: number): Promise<void> {
      await db.delete(tenants).where(eq(tenants.id, id));
  }

  // Leases
  async getLeases(): Promise<(Lease & { property: Property; tenant: Tenant })[]> {
    return await db.query.leases.findMany({
      with: { property: true, tenant: true }
    });
  }

  async getLease(id: number): Promise<Lease | undefined> {
    const [lease] = await db.select().from(leases).where(eq(leases.id, id));
    return lease;
  }

// LEASES: Corregido y con Generación Automática de Pago
  // server/storage.ts

async createLease(insertLease: InsertLease): Promise<Lease> {
  // 1. Insertamos el contrato
  const [lease] = await db.insert(leases).values({
    ...insertLease,
    value: insertLease.value.toString(),
  } as any).returning();

  // 2. Cobro del primer mes (Este sí suele quedar PENDING hasta que venza)
  await db.insert(payments).values({
    leaseId: lease.id,
    amount: lease.value.toString(),
    status: 'PENDING',
    dueDate: lease.startDate, 
    tipoPagamento: 'Asaas',
    notes: 'Primeiro mês de aluguel'
  } as any);

  // 3. LÓGICA DE CAUÇÃO (Dinheiro na mão!)
  if (insertLease.garantiaTipo === 'Caução' && insertLease.garantiaValor) {
    await db.insert(payments).values({
      leaseId: lease.id,
      amount: insertLease.garantiaValor.toString(),
      // CAMBIO CLAVE AQUÍ:
      status: 'RECEIVED',               // Ya está pagado
      valorRecebido: Number(insertLease.garantiaValor), // Monto recibido completo
      paymentDate: new Date(),          // Pagado hoy (día de entrega de llaves)
      tipoPagamento: 'Dinheiro',        // Generalmente recibido en efectivo/transferencia
      notes: 'Depósito de Caução recebido na assinatura do contrato'
    } as any);
    
    console.log(`[storage] Caução de R$ ${insertLease.garantiaValor} registrado como RECEBIDO.`);
  }

  return lease;
}

  async updateLeaseAsaasId(id: number, asaasId: string): Promise<Lease> {
    const [lease] = await db.update(leases)
      .set({ asaasSubscriptionId: asaasId })
      .where(eq(leases.id, id))
      .returning();
    return lease;
  }

  // Payments
  async getPayments(status?: string): Promise<(Payment & { lease: Lease })[]> {
    if (status) {
      return await db.query.payments.findMany({
        where: eq(payments.status, status),
        with: { lease: true }
      });
    }
    return await db.query.payments.findMany({
      with: { lease: true }
    });
  }

// PAYMENTS: Ajuste de nombres para el linter
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values({
      ...insertPayment,
      valor: insertPayment.amount?.toString(), // Aseguramos que use 'valor'
    } as any).returning();
    return payment;
  }

  async updatePaymentStatus(id: number, status: string, paymentDate?: Date): Promise<Payment> {
    const updates: any = { status };
    if (paymentDate) updates.paymentDate = paymentDate;
    
    const [payment] = await db.update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async updatePayment(id: number, updatePayment: Partial<InsertPayment>): Promise<Payment> {
    // Ensure payment exists
    const [existing] = await db.select().from(payments).where(eq(payments.id, id));
    if (!existing) {
      const err: any = new Error('Payment not found');
      err.code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    // Coerce numeric values
    const existingAmount = Number(existing.amount);

    // If valorRecebido provided, apply partial/total logic
    if (updatePayment.valorRecebido !== undefined && updatePayment.valorRecebido !== null) {
      const receivedRaw = (updatePayment.valorRecebido as any);
      const received = typeof receivedRaw === 'string' ? Number(receivedRaw) : Number(receivedRaw);

      // normalize tipoPagamento if provided
      const tipo = (updatePayment as any).tipoPagamento ?? existing.tipoPagamento ?? 'Asaas';

      // Case: total or overpayment
      if (!isNaN(received) && received >= existingAmount) {
        const updates: any = {
          status: 'RECEIVED',
          paymentDate: new Date(),
          tipoPagamento: tipo,
          valorRecebido: Math.round(received),
        };

        const [payment] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
        return payment;
      }

      // Case: parcial
      if (!isNaN(received) && received > 0 && received < existingAmount) {
        // mark current as RECEIVED with received amount
        const updates: any = {
          status: 'RECEIVED',
          paymentDate: new Date(),
          tipoPagamento: tipo,
          valorRecebido: Math.round(received),
        };

        const [payment] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();

        // create new pending payment for remainder
        const remainder = existingAmount - received;
        const newPaymentData: any = {
          leaseId: existing.leaseId,
          amount: String(remainder),
          valorRecebido: null,
          status: 'PENDING',
          dueDate: existing.dueDate,
          paymentDate: null,
          asaasPaymentId: null,
          notes: 'Saldo restante de pago parcial',
        };
        // don't pass tipoPagamento if null to let DB default apply
        if (tipo) newPaymentData.tipoPagamento = tipo;

        const [newPayment] = await db.insert(payments).values(newPaymentData).returning();

        // return updated payment (client will refresh list)
        return payment;
      }
    }

    // Default update path: update fields as provided
    const updateData: any = { ...updatePayment };
    if (updatePayment.amount !== undefined && updatePayment.amount !== null) {
      updateData.amount = String((updatePayment as any).amount);
    }

    const [payment] = await db.update(payments).set(updateData).where(eq(payments.id, id)).returning();
    return payment;
  }

  // Dashboard
 // Dashboard corregido
// DASHBOARD: El que ya te está funcionando
 async getDashboardStats() {
  console.log("[storage] Actualizando estadísticas del Dashboard...");

  // 1. Conteos base
  const [props] = await db.select({ count: sql<number>`count(*)` }).from(properties);
  const [tens] = await db.select({ count: sql<number>`count(*)` }).from(tenants);
  const [activeLeases] = await db.select({ count: sql<number>`count(*)` })
    .from(leases)
    .where(eq(leases.status, 'ACTIVE'));

  // 2. RECEITA PENDENTE: 
  // Sumamos el 'amount' de lo que está PENDING o OVERDUE (Atrasado).
  // No sumamos valor_recebido aquí porque aún no existe en estos registros.
  const pendingQuery = await db.select({ 
    total: sql<string>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)` 
  })
  .from(payments)
  .where(sql`${payments.status} IN ('PENDING', 'PENDENTE', 'OVERDUE')`);

  // 3. RECEITA RECEBIDA:
  // Aquí está la clave del Caução: Sumamos lo que REALMENTE entró ('valorRecebido').
  // Esto incluirá el Caução automático que pusimos como 'RECEIVED' y las bajas manuales.
  const receivedQuery = await db.select({ 
    total: sql<string>`COALESCE(SUM(CAST(${payments.valorRecebido} AS NUMERIC)), 0)` 
  })
  .from(payments)
  .where(sql`${payments.status} IN ('RECEIVED', 'PAGO')`);

  const stats = {
    totalProperties: Number(props.count),
    totalTenants: Number(tens.count),
    activeLeases: Number(activeLeases.count),
    pendingPaymentsAmount: parseFloat(pendingQuery[0]?.total || "0"),
    receivedPaymentsAmount: parseFloat(receivedQuery[0]?.total || "0"),
  };

  console.log("[storage] Stats calculadas con éxito:", stats);
  return stats;
}
}


export const storage = new DatabaseStorage();
