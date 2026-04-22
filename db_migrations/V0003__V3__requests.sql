
CREATE TABLE t_p37278024_kids_event_crm.requests (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER REFERENCES t_p37278024_kids_event_crm.users(id),
  city VARCHAR(100) NOT NULL,
  event_date DATE,
  event_time TIME,
  program VARCHAR(255),
  hero VARCHAR(255),
  address TEXT,
  children_count INTEGER,
  children_age VARCHAR(100),
  animator_question TEXT,
  animators_to_send TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
