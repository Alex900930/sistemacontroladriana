# ImobiERP - Real Estate Management System

## Overview

ImobiERP is a full-stack real estate ERP (Enterprise Resource Planning) system designed for property management in Brazil. The application manages property owners, properties, tenants, lease contracts, and payment tracking with integration to the Asaas payment platform for automated billing and payment splitting.

The system is built with a React frontend and Express backend, using PostgreSQL for data persistence. All user-facing content is in Brazilian Portuguese (pt-BR), with currency formatting in BRL (R$).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Shadcn/UI component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite for development and production builds
- **Charts**: Recharts for dashboard analytics and data visualization

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with typed routes defined in `shared/routes.ts`
- **Authentication**: Replit Auth integration with session management using connect-pg-simple
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod for runtime validation, drizzle-zod for schema-to-validation generation

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit manages migrations in `/migrations` directory

### Core Data Models
1. **Owners** - Property owners with Asaas subaccount integration for payment splitting
2. **Properties** - Real estate properties linked to owners
3. **Tenants** - Renters with Asaas customer ID for billing
4. **Leases** - Rental contracts with subscription management and adjustment indices (IPCA/IGP-M)
5. **Payments** - Payment records synchronized via Asaas webhooks

### Authentication
- Replit Auth handles user authentication via OpenID Connect
- Session management uses PostgreSQL for persistence
- Protected routes require authentication via `isAuthenticated` middleware

### API Contract Pattern
The project uses a shared API contract pattern where routes are defined in `shared/routes.ts` with:
- HTTP method and path
- Input validation schemas
- Response type schemas
This ensures type safety between frontend and backend.

## External Dependencies

### Payment Integration
- **Asaas API**: Brazilian payment platform for:
  - Customer management (tenants)
  - Subaccount creation (owners for payment splitting)
  - Subscription billing (lease payments)
  - Webhook handling for payment status updates (PAYMENT_RECEIVED, PAYMENT_OVERDUE)
- **Environment Variable**: `ASAAS_API_KEY` (uses sandbox URL by default)

### Database
- **PostgreSQL**: Primary data store
- **Environment Variable**: `DATABASE_URL` (connection string)

### Authentication
- **Replit Auth**: OpenID Connect provider
- **Environment Variables**: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migration tooling
- `@tanstack/react-query`: Server state management
- `react-hook-form` with `@hookform/resolvers`: Form handling with Zod validation
- `date-fns`: Date manipulation with pt-BR locale support
- `recharts`: Dashboard charts and visualizations
- `passport` / `openid-client`: Authentication handling