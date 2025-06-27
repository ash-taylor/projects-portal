# Projects Portal

- [Built With](#built-with)
- [AWS Services](#aws-services)
- [Getting Started](#1-getting-started)
- [Prerequisites](#12-prerequisites)
- [Optional Tools](#121-optional-tools)
- [Installation](#13-installation)
- [Environment](#14-environment)
- [Database](#15-database)
- [Local Database Initialisation](#151-local-database-initialisation)
- [Running the Database Locally](#152-running-the-database-locally)
- [Running Locally](#2-running-locally)
- [Prerequisites](#21-prerequisites)
- [Accessing the Application](#22-accessing-the-application)
- [Deployment](#3-deployment)
- [CI/CD](#4-cicd)
- [Author](#author)
- [License](#license)

A full-stack web application for the management of team project assignments, customers and team members.
The backend, infrastructure and UI are written in TypeScript. The infrastructure is defined as Infrastructure as Code (IaC) utilising the AWS Cloud Development Kit (CDK) and the UI is a React single page application (SPA).

This repo contains everything required to deploy the application to AWS, the only requirement is an AWS account with the relevant permissions to deploy the associated resources.

## Built With

- [AWS](https://aws.amazon.com/) - Cloud Platform
- [NestJS](https://nestjs.com/) - API framework
- [PostgreSQL](https://www.postgresql.org/) - Relational Database Management System (RDBMS)
- [TypeORM](https://typeorm.io/) - Database ORM
- [React](https://react.dev/) - UI Library
- [Vite](https://vite.dev/) - React Build Tooling
- [Cloudscape](https://cloudscape.design/) - UI Design System

## AWS Services

- [Amazon CloudFront](https://aws.amazon.com/cloudfront/) - Content Delivery Network (CDN)
- [AWS WAF](https://aws.amazon.com/waf) - Web Application Firewall
- [Amazon Cognito](https://aws.amazon.com/cognito/) - Authentication
- [Amazon API Gateway](https://aws.amazon.com/api-gateway/)
- [AWS Lambda](https://aws.amazon.com/lambda) - Serverless Compute
- [Amazon VPC](https://aws.amazon.com/vpc) - Virtual Private Cloud
- [Amazon RDS](https://aws.amazon.com/rds/) - Relational Database Service
- [Amazon S3](https://aws.amazon.com/s3) - Cloud Storage

See this [Architecture Diagram](./infra/projects-portal-architecture.drawio.png) for further context.

## 1. Getting Started

This section will get you started with setting up the codebase locally for development. See [Deployment](#3-deployment) section for notes on how to deploy the project.

### 1.2. Prerequisites

- Base requirements
  - [AWS CLI](https://aws.amazon.com/cli/)
  - [Node.js v24.x](https://nodejs.org/en/)
  - [PNPM v10.x0](https://pnpm.io/)
  - [Docker](https://www.docker.com/)

#### 1.2.1. Optional Tools

- Additional requirements
  - [Biome VSCode Extension](https://biomejs.dev/reference/vscode/) - For code linting and formatting.

### 1.3. Installation

Install all dependencies:

```bash
pnpm initial-setup
```

### 1.4. Environment

- Have a look at [./api/.env.example](./api/.env.example)
- Copy the example to a new file called .env:

```bash
cp ./api/.env.example ./api/.env
```

- The application will need to be deployed to AWS before it can be run locally.
- On successful [Deployment](#3-deployment) the relevant parameters required for the environment variables will be output to the terminal. These need to be configured in the .env file.

### 1.5. Database

- Technologies used
  - [Amazon RDS](https://alembic.sqlalchemy.org/)
  - [PostgreSQL](https://vercel.com/docs/storage/vercel-postgres)
  - [TypeORM](https://magicstack.github.io/asyncpg/current/)

This application utilises an [Amazon RDS](https://aws.amazon.com/rds/) instance deployed inside a private subnet within the VPC. This database is configured on first deployment with an [AWS custom resource Lambda function](./infra/lib/lambdas/init-rds-database/init-rds-db-lambda.ts).

To run the application locally it is required to run a local PostgreSQL database.

#### 1.5.1. Local Database Initialisation

To first configure and initialise the local database, with Docker running, execute:

```bash
pnpm init:local-db
```

This will utilise this [Docker Compose file](./local-db/docker-compose.yaml) to pull and startup a containerised local PostgreSQL database as well as a local [PGAdmin](https://www.pgadmin.org/) server to interface with the database in a browser.

It will also then execute this [SQL](./local-db/init.sql) to initialise the database.

A local containerised postgreSQL database will now be running on port 5432.

#### 1.5.2. Running the database locally

To start an already configured local database instance, execute:

```bash
pnpm start:local-db
```

## 2. Running Locally

### 2.1. Prerequisites

- The Database will need to be running locally.
- You will need the [AWS CLI](https://aws.amazon.com/cli/) with user credentials that have permissions for the application to access the following AWS services:
  - Secrets Manager
  - Amazon Cognito

The local database config will need adding to the environment variables. This config can be found inside the [Docker Compose file](./local-db/docker-compose.yaml)

The app can now be run locally. To start the backend run:

```bash
pnpm start:api
```

To run the UI locally, run:

```bash
pnpm start:ui
```

### 2.2. Accessing the application

By default, the UI can be accessed locally by visiting <http://localhost:5173/>

- The UI will run on port 5173 and the backend on port 3000.
- You will see a landing in screen, from which you can:
  - Sign up
  - Log in
  - You can now:
    - Create, update and delete Customers.
    - Create, update and delete Projects.
      - A Project must to be associated with a Customer
    - Assign / Unassign team members from projects.
- A general user account only has read access - they cannot create / update / delete any entities.
- An admin user has full admin rights in the application.

## 3. Deployment

To deploy the application you will need an [AWS](https://aws.amazon.com/) account with permissions for CloudFormation to deploy the application. You may need to first [bootstrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) the account if it is the first time deploying CDK.

Then run:

```bash
pnpm cdk-deploy
```

## 4. CI/CD

This repo utilises [Husky](https://typicode.github.io/husky/) to execute scripts before every commit and every git push. Before any code is committed and pushed it will be automatically linted, formatted and automated tests will run.

The repo contains a [Github Actions Workflow](./.github/workflows/ci.yml), on every pull request the code will be:

- Checked out
- Dependencies installed
- Dependencies audited
- Linting and formatting checks
- Built
- Automated tests run

## Author

- **Ashley Taylor** - [GitHub](https://github.com/ash-taylor)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
