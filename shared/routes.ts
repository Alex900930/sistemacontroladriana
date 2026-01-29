import { z } from 'zod';
import { 
  insertOwnerSchema, owners, 
  insertPropertySchema, properties,
  insertTenantSchema, tenants,
  insertLeaseSchema, leases,
  insertPaymentSchema, payments
} from './schema';

// Shared error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// API Contract
export const api = {
  // Owners (Propietarios)
  owners: {
    list: {
      method: 'GET' as const,
      path: '/api/owners',
      responses: {
        200: z.array(z.custom<typeof owners.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/owners/:id',
      responses: {
        200: z.custom<typeof owners.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/owners',
      input: insertOwnerSchema,
      responses: {
        201: z.custom<typeof owners.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/owners/:id',
      input: insertOwnerSchema.partial(),
      responses: {
        200: z.custom<typeof owners.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/owners/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },

  // Properties (Inmuebles)
  properties: {
    list: {
      method: 'GET' as const,
      path: '/api/properties',
      responses: {
        200: z.array(z.custom<typeof properties.$inferSelect & { owner: typeof owners.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties',
      input: insertPropertySchema,
      responses: {
        201: z.custom<typeof properties.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/properties/:id',
      responses: {
        200: z.custom<typeof properties.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
     update: {
      method: 'PUT' as const,
      path: '/api/properties/:id',
      input: insertPropertySchema.partial(),
      responses: {
        200: z.custom<typeof properties.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
        method: 'DELETE' as const,
        path: '/api/properties/:id',
        responses: {
          204: z.void(),
          404: errorSchemas.notFound,
        },
      }
  },

  // Tenants (Inquilinos)
  tenants: {
    list: {
      method: 'GET' as const,
      path: '/api/tenants',
      responses: {
        200: z.array(z.custom<typeof tenants.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tenants',
      input: insertTenantSchema,
      responses: {
        201: z.custom<typeof tenants.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tenants/:id',
      responses: {
        200: z.custom<typeof tenants.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
        method: 'PUT' as const,
        path: '/api/tenants/:id',
        input: insertTenantSchema.partial(),
        responses: {
          200: z.custom<typeof tenants.$inferSelect>(),
          404: errorSchemas.notFound,
        },
      },
      delete: {
          method: 'DELETE' as const,
          path: '/api/tenants/:id',
          responses: {
            204: z.void(),
            404: errorSchemas.notFound,
          },
        }
  },

  // Leases (Contratos)
  leases: {
    list: {
      method: 'GET' as const,
      path: '/api/leases',
      responses: {
        200: z.array(z.custom<typeof leases.$inferSelect & { property: typeof properties.$inferSelect, tenant: typeof tenants.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/leases',
      input: insertLeaseSchema,
      responses: {
        201: z.custom<typeof leases.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/leases/:id',
      responses: {
        200: z.custom<typeof leases.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    syncAsaas: { // For manual sync or creation
        method: 'POST' as const,
        path: '/api/leases/:id/sync',
        responses: {
          200: z.object({ success: z.boolean(), message: z.string() }),
          404: errorSchemas.notFound,
        },
    },
  },

  // Payments (Pagamentos)
  payments: {
    list: {
      method: 'GET' as const,
      path: '/api/payments',
      input: z.object({
        status: z.enum(['PENDING', 'RECEIVED', 'OVERDUE']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof payments.$inferSelect & { lease: typeof leases.$inferSelect }>()),
      },
    },
  },

  // Dashboard Stats
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      responses: {
        200: z.object({
          totalProperties: z.number(),
          totalTenants: z.number(),
          activeLeases: z.number(),
          pendingPaymentsAmount: z.number(),
          receivedPaymentsAmount: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
