
-- Добавляем процент премии к плану менеджера
ALTER TABLE t_p37278024_kids_event_crm.manager_plans
  ADD COLUMN IF NOT EXISTS bonus_pct DECIMAL(5,2) DEFAULT 0;

-- Добавляем процент удержания за города из выплаты (по умолчанию 50%)
ALTER TABLE t_p37278024_kids_event_crm.manager_plans
  ADD COLUMN IF NOT EXISTS cities_deduct_pct DECIMAL(5,2) DEFAULT 50;
