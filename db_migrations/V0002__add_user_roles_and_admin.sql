ALTER TABLE t_p613096_greeting_project_36.users 
ADD COLUMN role VARCHAR(50) DEFAULT 'basic' NOT NULL;

CREATE INDEX idx_users_role ON t_p613096_greeting_project_36.users(role);

INSERT INTO t_p613096_greeting_project_36.users 
(email, phone, full_name, password_hash, is_verified, role) 
VALUES 
('admin@eventhub.ru', '+79991234567', 'Администратор EventHub', 
 'c1c224b03cd9bc7b6a86d77f5dace40191766c485cd55dc48caf9ac873335d6f', 
 TRUE, 'admin');
