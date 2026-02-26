import { pgTable, text, serial, integer, numeric, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth Models
export * from "./models/auth.js";

// === TABLE DEFINITIONS ===

// Mantenemos el nombre de la constante 'owners' para el código, 
// pero la tabla en la DB se llamará 'proprietarios'
export const owners = pgTable("proprietarios", {
  id: serial("id").primaryKey(),
  name: text("nome").notNull(),
  email: text("email").notNull(),
  cpfCnpj: text("cpf_cnpj").notNull(),
  birthDate: text("birth_date"),
  phone: text("telefone"), // <--- NUEVO
  // Bloque de Dirección
  address: text("endereco"), // <--- NUEVO
  addressNumber: text("endereco_numero"), // <--- NUEVO
  province: text("bairro"), // <--- NUEVO (Bairro)
  postalCode: text("cep"), // <--- NUEVO (CEP)
  city: text("cidade"), // <--- NUEVO
  state: text("estado"), // <--- NUEVO (UF)
  
  asaasSubaccountId: text("asaas_subaccount_id"), 
  bankInfo: text("bank_info"), 
  pixKey: text("pix_key"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("propriedades", {
  id: serial("id").primaryKey(),
  address: text("endereco").notNull(),
  description: text("descricao"),
  ownerId: integer("proprietario_id").notNull().references(() => owners.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenants = pgTable("inquilinos", {
  id: serial("id").primaryKey(),
  name: text("nome").notNull(),
  email: text("email").notNull(),
  cpfCnpj: text("cpf_cnpj").notNull(),
  phone: text("telefone"),
  asaasCustomerId: text("asaas_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leases = pgTable("alugueis", {
  id: serial("id").primaryKey(),
  propertyId: integer("propriedade_id").notNull().references(() => properties.id),
  tenantId: integer("inquilino_id").notNull().references(() => tenants.id),
  value: numeric("valor").notNull(),
  startDate: timestamp("data_inicio").notNull(),
  endDate: timestamp("data_fim").notNull(),
  dueDay: integer("dia_vencimento").notNull(),
  adjustmentIndex: text("indice_reajuste").notNull(), // IGP-M, IPCA, etc.
  status: text("status").notNull().default("ACTIVE"),

  dataRescisao: timestamp("data_rescisao"),
  dataEntregaChaves: timestamp("data_entrega_chaves"),
  motivoRescisao: text("motivo_rescisao"),
  valorDebitoRescisao: numeric("valor_debito_rescisao").default("0"),

  // Checklist de documentos (Booleanos)
  hasTermoChaves: boolean("has_termo_chaves").default(false),
  hasRescisaoContrato: boolean("has_rescisao_contrato").default(false),
  hasDistratoComDebitos: boolean("has_distrato_com_debitos").default(false),
  hasDistratoSemDebitos: boolean("has_distrato_sem_debitos").default(false),
  
  // --- NUEVOS CAMPOS PARA LA LÓGICA DE ADRIANA ---
  garantiaTipo: text("garantia_tipo"), // 'Caução' o 'Seguro Fiança'
  garantiaValor: numeric("garantia_valor"), // Aquí guardamos los 4500 del ejemplo
  inicioCobranca: timestamp("inicio_cobranca"), // Fecha en que termina el adelanto y empieza el cobro real
  
  asaasSubscriptionId: text("asaas_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),


});
export const payments = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  leaseId: integer("aluguel_id").notNull().references(() => leases.id),
  amount: numeric("valor").notNull(),
  tipoPagamento: text("tipo_pagamento").default("Asaas").notNull(),
  valorRecebido: integer("valor_recebido"),
  notes: text("notas"),
  /* status: text("status").default("PENDENTE").notNull(),  */
  status: text("status").default("PENDING").notNull(),
  dueDate: timestamp("data_vencimento").notNull(),
  paymentDate: timestamp("data_pagamento"),
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
// Actualiza el insertOwnerSchema
export const insertOwnerSchema = createInsertSchema(owners).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  email: z.string().email("Email inválido"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  addressNumber: z.string().min(1, "Número é obrigatório"),
  province: z.string().min(1, "Bairro é obrigatório"),
  postalCode: z.string().min(8, "CEP inválido"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "UF é obrigatória").max(2),
  pixKey: z.string().optional().nullable(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true });
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
const garantiaTipoEnum = z.enum(["Caução", "Seguro Fiança"]);

export const insertLeaseSchema = createInsertSchema(leases).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  // Aseguramos que estos campos se manejen correctamente
  value: z.preprocess((val) => Number(val), z.number().min(1)),
  garantiaValor: z.preprocess((val) => val ? Number(val) : 0, z.number().optional()),
  propertyId: z.preprocess((val) => Number(val), z.number()),
  tenantId: z.preprocess((val) => Number(val), z.number()),
  dueDay: z.preprocess((val) => Number(val), z.number().min(1).max(31)),
  // Las fechas las validamos como objetos Date
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  inicioCobranca: z.coerce.date().optional(),

   status: z.string().default("ACTIVE"),
  dataRescisao: z.coerce.date().optional().nullable(),
  dataEntregaChaves: z.coerce.date().optional().nullable(),
  valorDebitoRescisao: z.coerce.number().optional(),
  hasTermoChaves: z.boolean().optional(),
  hasRescisaoContrato: z.boolean().optional(),
  hasDistratoComDebitos: z.boolean().optional(),
  hasDistratoSemDebitos: z.boolean().optional(),
});

const tipoPagamentoEnum = z.enum(["Asaas", "Dinheiro", "Cartão", "Pix", "Outro"]);

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true }).extend({
  amount: z.coerce.number(),
  dueDate: z.coerce.date(),
  paymentDate: z.coerce.date().optional().nullable(),
  tipoPagamento: tipoPagamentoEnum.optional(),
  valorRecebido: z.coerce.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
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

export type PropertyWithDetails = Property & { owner: Owner };
export type LeaseWithDetails = Lease & { property: Property; tenant: Tenant };