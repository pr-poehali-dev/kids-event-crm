
CREATE TABLE t_p37278024_kids_event_crm.users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  messenger VARCHAR(20) DEFAULT 'whatsapp',
  role VARCHAR(20) DEFAULT 'manager',
  balance DECIMAL(12,2) DEFAULT 0,
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
