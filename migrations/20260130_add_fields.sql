-- Migration: add garantia_tipo to alugueis and tipo_pagamento + valor_recebido to pagamentos

ALTER TABLE alugueis
  ADD COLUMN IF NOT EXISTS garantia_tipo TEXT;

ALTER TABLE pagamentos
  ADD COLUMN IF NOT EXISTS tipo_pagamento TEXT NOT NULL DEFAULT 'Asaas';

ALTER TABLE pagamentos
  ADD COLUMN IF NOT EXISTS valor_recebido INTEGER;
