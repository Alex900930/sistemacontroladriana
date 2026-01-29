import { pgTable, text, serial, integer, numeric, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth Models
export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  cpfCnpj: text("cpf_cnpj").notNull(),
  asaasSubaccountId: text("asaas_subaccount_id"), // For payment splitting
  bankInfo: text("bank_info"), // JSON string or simple text for now
  createdAt: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().references(() => owners.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  cpfCnpj: text("cpf_cnpj").notNull(),
  phone: text("phone"),
  asaasCustomerId: text("asaas_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leases = pgTable("leases", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  value: numeric("value").notNull(), // Rent amount
  dueDay: integer("due_day").notNull(), // Day of month (1-31)
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  adjustmentIndex: text("adjustment_index").notNull(), // 'IPCA', 'IGP-M'
  asaasSubscriptionId: text("asaas_subscription_id"),
  status: text("status").default("ACTIVE").notNull(), // ACTIVE, EXPIRED, TERMINATED
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  leaseId: integer("lease_id").notNull().references(() => leases.id),
  amount: numeric("amount").notNull(),
  status: text("status").default("PENDING").notNull(), // PENDING, RECEIVED, OVERDUE
  dueDate: timestamp("due_date").notNull(),
  paymentDate: timestamp("payment_date"),
  asaasPaymentId: text("asaas_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const ownersRelations = relations(owners, ({ many }) => ({
  properties: many(properties),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(owners, {
    fields: [properties.ownerId],
    references: [owners.id],
  }),
  leases: many(leases),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  leases: many(leases),
}));

export const leasesRelations = relations(leases, ({ one, many }) => ({
  property: one(properties, {
    fields: [leases.propertyId],
    references: [properties.id],
  }),
  tenant: one(tenants, {
    fields: [leases.tenantId],
    references: [tenants.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  lease: one(leases, {
    fields: [payments.leaseId],
    references: [leases.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertOwnerSchema = createInsertSchema(owners).omit({ id: true, createdAt: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true });
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
// Coerce numeric fields and dates for forms
export const insertLeaseSchema = createInsertSchema(leases).omit({ id: true, createdAt: true }).extend({
  value: z.coerce.number(),
  dueDay: z.coerce.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true }).extend({
  amount: z.coerce.number(),
  dueDate: z.coerce.date(),
  paymentDate: z.coerce.date().optional().nullable(),
});

// === EXPLICIT API TYPES ===

export type Owner = typeof owners.$inferSelect;
export type InsertOwner = z.infer<typeof insertOwnerSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type Lease = typeof leases.$inferSelect;
export type InsertLease = z.infer<typeof insertLeaseSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// With Relations
export type PropertyWithDetails = Property & { owner: Owner };
export type LeaseWithDetails = Lease & { property: Property; tenant: Tenant };
