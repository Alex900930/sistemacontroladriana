-- Migration: add notas column to pagamentos

ALTER TABLE pagamentos
  ADD COLUMN IF NOT EXISTS notas TEXT;
