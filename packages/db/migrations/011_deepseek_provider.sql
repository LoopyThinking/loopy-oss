-- Migration 011: Add DeepSeek as an LLM provider option
-- Alters the CHECK constraint on org_llm_configs.provider to include 'deepseek'.

ALTER TABLE org_llm_configs DROP CONSTRAINT IF EXISTS org_llm_configs_provider_check;
ALTER TABLE org_llm_configs ADD CONSTRAINT org_llm_configs_provider_check
  CHECK (provider IN ('anthropic','openai','google','openai_compatible','deepseek'));
