import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { CloudFormationCustomResourceEvent } from 'aws-lambda';
import postgres from 'postgres';
import { InitRdsDBHandlerProps } from '../../constructs/init-rds-database/init-rds-database-handler.props';

const client = new SecretsManagerClient({});

export async function handler(event: CloudFormationCustomResourceEvent) {
  const props = event.ResourceProperties as unknown as InitRdsDBHandlerProps;

  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      await initRdsInstance(props);
      break;
    default:
      break;
  }
}

async function initRdsInstance(props: InitRdsDBHandlerProps) {
  const { secretId } = props;

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    }),
  );

  if (!response.SecretString) throw new Error('RDS Secret not found');

  const { dbname, username, password, host, port } = JSON.parse(response.SecretString);

  const sql = postgres({
    host,
    port,
    username,
    password,
    database: dbname,
    ssl: { rejectUnauthorized: false },
  });

  const result = await sql`SELECT 'HELLO WORLD' as message;`;

  try {
    await sql`DROP TABLE IF EXISTS "user";`;
    await sql`DROP TABLE IF EXISTS project;`;
    await sql`DROP TABLE IF EXISTS customer;`;
    await sql`DROP TYPE IF EXISTS project_status;`;
    await sql`DROP TYPE IF EXISTS user_role;`;

    await sql`CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'completed', 'on_hold');`;
    await sql`CREATE TYPE user_role AS ENUM ('user', 'admin');`;

    await sql`
      CREATE TABLE customer (
        id UUID PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        details TEXT
      );`;

    await sql`CREATE INDEX idx_customer_id ON customer (id);`;
    await sql`CREATE INDEX idx_customer_name ON customer (name);`;

    await sql`
      CREATE TABLE project (
        id UUID PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        status project_status NOT NULL,
        details TEXT,
        customer_id UUID NOT NULL REFERENCES customer(id) ON DELETE CASCADE
      );`;

    await sql`CREATE INDEX idx_project_id ON project (id);`;
    await sql`CREATE INDEX idx_project_name ON project (name);`;
    await sql`CREATE INDEX idx_project_status ON project (status);`;

    await sql`
      CREATE TABLE "user" (
        sub VARCHAR(50) PRIMARY KEY NOT NULL UNIQUE,
        first_name VARCHAR(30) NOT NULL,
        last_name VARCHAR(30) NOT NULL,
        user_roles user_role[] NOT NULL,
        email VARCHAR(30) NOT NULL UNIQUE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        project_id UUID REFERENCES project(id) ON DELETE SET NULL
      );`;

    await sql`CREATE INDEX idx_user_sub ON "user" (sub);`;
    await sql`CREATE INDEX idx_user_roles ON "user" (user_roles);`;
    await sql`CREATE INDEX idx_user_email ON "user" (email);`;
  } catch (error: unknown) {
    // biome-ignore lint/suspicious/noConsole: <explanation>
    console.error('Error initializing database schema', error);
    throw error;
  }

  return {
    status: 'OK',
    message: result[0].message,
  };
}
