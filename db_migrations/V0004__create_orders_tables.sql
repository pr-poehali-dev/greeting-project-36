CREATE TABLE IF NOT EXISTS t_p613096_greeting_project_36.orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    total_amount INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p613096_greeting_project_36.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    ticket_type VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES t_p613096_greeting_project_36.orders(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON t_p613096_greeting_project_36.orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON t_p613096_greeting_project_36.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON t_p613096_greeting_project_36.order_items(order_id);
