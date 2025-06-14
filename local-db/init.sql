CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS "user";
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS customer;
DROP TYPE IF EXISTS project_status;
DROP TYPE IF EXISTS user_role;

CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'completed', 'on_hold', 'cancelled');
CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TABLE customer (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR(50) NOT NULL UNIQUE,
	active BOOLEAN NOT NULL DEFAULT TRUE,
	details TEXT
);

CREATE INDEX idx_customer_id ON customer (id);
CREATE INDEX idx_customer_name ON customer (name);

CREATE TABLE project (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    status project_status NOT NULL,
    details TEXT,
    customer_id UUID NOT NULL REFERENCES customer(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_id ON project (id);
CREATE INDEX idx_project_name ON project (name);
CREATE INDEX idx_project_status ON project (status);

CREATE TABLE "user" (
    sub VARCHAR(50) PRIMARY KEY NOT NULL UNIQUE,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    user_roles user_role[] NOT NULL,
    email VARCHAR(30) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    project_id UUID REFERENCES project(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_sub ON "user" (sub);
CREATE INDEX idx_user_roles ON "user" (user_roles);
CREATE INDEX idx_user_email ON "user" (email);