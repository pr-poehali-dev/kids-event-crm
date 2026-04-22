
CREATE TABLE t_p37278024_kids_event_crm.manager_cities (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER REFERENCES t_p37278024_kids_event_crm.users(id),
  city_name VARCHAR(100) NOT NULL,
  publish_cost DECIMAL(10,2) DEFAULT 270,
  target_kpd DECIMAL(5,2) DEFAULT 10,
  expires_at TIMESTAMP,
  screenshot_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
