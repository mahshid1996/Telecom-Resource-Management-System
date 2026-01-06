# Telecom Resource Management System

A Node.js backend **inventory** microservice for managing telecom resources. This microservice sits on top of MongoDB and provides the domain logic and APIs: it exposes secure REST/gRPC endpoints, applies telecom inventory rules, integrates with Kafka, and hides the underlying database from clients.
Clients never access MongoDB directly; they call this service, which gives a stable, versioned contract and lets us change the database implementation without impacting consumers:
- **Logical resources** (like  MSISDN)
- **Physical resources** (like SIM)
- **Resource categories**
- **Resource schemas**

It exposes:
- Public **REST APIs** (with JWT security + Swagger docs)
- Internal **gRPC APIs** (for other microservices)
- **Kafka** integration, **health checks**, centralized **logging**, and external **policy/config loading**.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start (Run Locally)](#quick-start-run-locally)
   - [Prerequisites](#prerequisites)
   - [Setup](#setup)
   - [Start the Service](#start-the-service)
   - [Smoke Test](#smoke-test)
3. [Key Features](#key-features)
4. [API Overview](#api-overview)
   - [Authentication & Roles](#authentication--roles)
   - [REST Endpoints](#rest-endpoints)
   - [Health Check](#health-check)
   - [Internal gRPC API](#internal-grpc-api)
5. [Example Usage (cURL)](#example-usage-curl)
6. [Architecture & Components](#architecture--components)
7. [Project Structure](#project-structure)
8. [Future Improvements](#future-improvements)

---

## Overview

This service acts as a **Telecom Resource Inventory** and can be used by:

- External clients (via **REST + Swagger**)
- Other backend microservices, such as **Order Management**, **Provisioning**, or **Customer Management** (via **gRPC**)

It demonstrates production-style patterns:

- JWT-secured REST APIs
- OpenAPI/Swagger documentation
- gRPC for internal communication
- Kafka integration for events
- Health checks for MongoDB & Kafka
- Structured logging & audit logging
- External policy/config loading

---

## Quick Start (Run Locally)
node src/index.js
http://localhost:3000/api-docs -> swagger


### Prerequisites

- **Node.js** 
- **MongoDB** running on: `mongodb://localhost:27017`
- **Kafka** broker running on: `localhost:9092`
- Optional: **Master-config service** on:  
  `http://localhost:3030/master-config?type=Policy`

### Setup

1. **Clone repo & install dependencies**

   ```bash
   git clone <your-repo-url>
   cd resource-management-system
   npm install