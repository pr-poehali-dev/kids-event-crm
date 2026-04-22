
CREATE TABLE t_p37278024_kids_event_crm.manager_plans (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER REFERENCES t_p37278024_kids_event_crm.users(id),
  month_year VARCHAR(7) NOT NULL,
  plan_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(manager_id, month_year)
);

CREATE TABLE t_p37278024_kids_event_crm.payouts (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER REFERENCES t_p37278024_kids_event_crm.users(id),
  period_label VARCHAR(100),
  commission_amount DECIMAL(12,2) DEFAULT 0,
  bonus_amount DECIMAL(12,2) DEFAULT 0,
  cities_payment DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

CREATE TABLE t_p37278024_kids_event_crm.transfer_requests (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES t_p37278024_kids_event_crm.users(id),
  manager_id INTEGER REFERENCES t_p37278024_kids_event_crm.users(id),
  order_id INTEGER REFERENCES t_p37278024_kids_event_crm.orders(id),
  amount DECIMAL(12,2) NOT NULL,
  recipient_phone VARCHAR(20),
  recipient_bank VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  done_at TIMESTAMP
);

CREATE TABLE t_p37278024_kids_event_crm.balance_transactions (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER REFERENCES t_p37278024_kids_event_crm.users(id),
  type VARCHAR(30) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p37278024_kids_event_crm.notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p37278024_kids_event_crm.users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  reference_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
