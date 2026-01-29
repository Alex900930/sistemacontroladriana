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

  async createLease(insertLease: InsertLease): Promise<Lease> {
    const [lease] = await db.insert(leases).values({
      ...insertLease,
      value: insertLease.value.toString(),
    }).returning();
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

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values({
      ...insertPayment,
      amount: insertPayment.amount.toString(),
    }).returning();
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

  // Dashboard
  async getDashboardStats() {
    const [props] = await db.select({ count: sql<number>`count(*)` }).from(properties);
    const [tens] = await db.select({ count: sql<number>`count(*)` }).from(tenants);
    const [activeLeases] = await db.select({ count: sql<number>`count(*)` }).from(leases).where(eq(leases.status, 'ACTIVE'));
    
    // Sum payments
    // Cast to number because numeric returns string in JS
    const pending = await db.select({ 
      amount: sql<string>`sum(${payments.amount})` 
    }).from(payments).where(eq(payments.status, 'PENDING'));
    
    const received = await db.select({ 
      amount: sql<string>`sum(${payments.amount})` 
    }).from(payments).where(eq(payments.status, 'RECEIVED'));

    return {
      totalProperties: Number(props.count),
      totalTenants: Number(tens.count),
      activeLeases: Number(activeLeases.count),
      pendingPaymentsAmount: Number(pending[0]?.amount || 0),
      receivedPaymentsAmount: Number(received[0]?.amount || 0),
    };
  }
}

export const storage = new DatabaseStorage();
