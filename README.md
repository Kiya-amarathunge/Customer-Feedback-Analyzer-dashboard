# LOLC Customer Feedback System

A full-stack enterprise customer feedback collection, SMS link tracking, and analytics platform built for **LOLC Holdings PLC**.

> **Version:** 1.0.0 &nbsp;|&nbsp; **Backend:** Spring Boot 3.2 &nbsp;|&nbsp; **Database:** Oracle 21c XE &nbsp;|&nbsp; **Frontend:** React 18 + TypeScript

---

## Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Running the Applications](#running-the-applications)
- [Features](#features)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Security](#security)
- [Production Deployment Checklist](#production-deployment-checklist)

---

## System Overview

The LOLC Customer Feedback System consists of **three independently running applications** that work together:

| Application | Purpose | Port |
|---|---|---|
| `backend` | Spring Boot REST API | 8080 |
| `feedback-app` | Customer-facing feedback form | 3000 |
| `admin-dashboard` | Internal admin analytics portal | 3001 |

The system enables LOLC branch staff to send personalized SMS feedback links to customers after service interactions. Customer responses are tracked in real time and aggregated into an analytics dashboard for management review.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CUSTOMER PORTAL  (feedback-app — port 3000)                    │
│                                                                 │
│  • Mobile-optimized feedback form                               │
│  • English & Indonesian language support                        │
│  • Accessed via SMS link: /feedback?ref=<TOKEN>                 │
│  • Star ratings + comments submission                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API calls
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  SPRING BOOT BACKEND  (backend — port 8080)                     │
│                                                                 │
│  Public Endpoints:                                              │
│    POST  /api/feedback                                          │
│    GET   /api/branches                                          │
│    POST  /api/auth/login                                        │
│    POST  /api/links/{token}/opened                              │
│    POST  /api/links/{token}/completed                           │
│                                                                 │
│  Admin Endpoints (JWT Protected):                               │
│    POST  /api/admin/send-link                                   │
│    GET   /api/admin/feedback-links                              │
│    GET   /api/admin/feedback-links/summary                      │
│    POST  /api/admin/employees                                   │
│    GET   /api/admin/employees                                   │
│    GET   /api/admin/employee-performance                        │
│    GET   /api/analytics/**                                      │
│    GET   /api/responses/**                                      │
│                                                                 │
│  External API (API Key Protected):                              │
│    POST  /api/external/send-feedback-link                       │
│                                                                 │
│  Features: JWT Auth · BCrypt · CORS · Validation · Notify.lk   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HikariCP Connection Pool
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  ORACLE DATABASE 21c XE  (port 1521)                            │
│                                                                 │
│  Tables:                                                        │
│    ADMIN_USERS          — System administrators                 │
│    BRANCHES             — LOLC branch locations                 │
│    FEEDBACK_RESPONSES   — Customer feedback submissions         │
│    EMPLOYEES            — Staff linked to feedback              │
│    FEEDBACK_LINKS       — SMS link tracking records             │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API calls
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD  (admin-dashboard — port 3001)                 │
│                                                                 │
│  • JWT-authenticated admin login                                │
│  • Analytics: KPI cards, charts, branch performance            │
│  • Send feedback SMS links to customers                         │
│  • Employee performance rankings                                │
│  • Feedback response table with export                          │
└─────────────────────────────────────────────────────────────────┘
```

### SMS Feedback Link Flow

```
Admin enters Employee No. + Customer Mobile
              ↓
Backend generates unique token → stores in FEEDBACK_LINKS
              ↓
SMS sent via Notify.lk → Customer receives link
http://localhost:3000/feedback?ref=<TOKEN>
              ↓
Customer opens link → status: OPENED
              ↓
Customer submits feedback → status: COMPLETED
              ↓
Feedback linked to employee → visible in Employee Performance tab
```

---

## Project Structure

```
lolc-feedback-system/
│
├── backend/                            # Spring Boot REST API
│   └── src/main/java/com/lolc/feedback/
│       ├── config/                     # Security, CORS configuration
│       ├── controller/                 # REST controllers
│       ├── dto/                        # Data transfer objects
│       ├── model/                      # JPA entity classes
│       ├── repository/                 # Spring Data JPA repositories
│       ├── security/                   # JWT filter, utilities
│       └── service/                    # Business logic services
│
├── feedback-app/                       # Customer feedback form (React)
│   └── src/
│       ├── components/                 # FeedbackForm, StarRating
│       ├── types/                      # TypeScript interfaces
│       └── utils/                      # API calls, translations
│
└── admin-dashboard/                    # Admin portal (React)
    └── src/
        ├── components/                 # FeedbackModal, shared UI
        ├── hooks/                      # useAuth
        ├── pages/                      # DashboardPage, SendLinksPage,
        │                               # EmployeePerformancePage
        ├── services/                   # API service layer
        └── types/                      # TypeScript interfaces
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Customer Frontend | React 18, TypeScript |
| Admin Frontend | React 18, TypeScript, Recharts |
| Backend | Spring Boot 3.2, Java 17 |
| Database | Oracle 21c XE |
| ORM | Hibernate 6 / Spring Data JPA |
| Authentication | JWT (JJWT 0.11.5) |
| Security | Spring Security 6.2 |
| Connection Pool | HikariCP |
| SMS Service | Notify.lk API |
| Build Tools | Maven 3.9, Create React App |

---

## Prerequisites

Ensure the following are installed before running the project:

- **Java 17+** — [Download](https://adoptium.net/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **Maven 3.9+** — [Download](https://maven.apache.org/)
- **Oracle Database 21c XE** — [Download](https://www.oracle.com/database/technologies/xe-downloads.html)
- **IntelliJ IDEA** (recommended for backend)
- **VS Code** (recommended for frontends)

---

## Database Setup

### 1. Install Oracle 21c XE
Download and install Oracle Database 21c Express Edition. During installation set the system password.

### 2. Create the application user
Open **SQL*Plus** as SYSDBA and run:

```sql
ALTER SESSION SET CONTAINER = XEPDB1;

CREATE USER lolcadmin IDENTIFIED BY Admin2026;
GRANT CONNECT, RESOURCE, DBA TO lolcadmin;
GRANT UNLIMITED TABLESPACE TO lolcadmin;
```

### 3. Tables are auto-created
Hibernate `ddl-auto=update` automatically creates all required tables on first startup:

```
ADMIN_USERS        BRANCHES        FEEDBACK_RESPONSES
EMPLOYEES          FEEDBACK_LINKS
```

### 4. Seed the admin user
After first startup, insert the admin account via SQL*Plus:

```sql
UPDATE ADMIN_USERS
SET PASSWORD_HASH = '$2a$10$RMRrkpr31QWKyJBgCx6OR.dKzRAAiFuCT9odzPdl/NVa2TK2woGlC'
WHERE USERNAME = 'admin';
COMMIT;
```

> Default credentials: **username:** `admin` **password:** `Admin@2026`
> Change the password immediately in production.

---

## Running the Applications

All three applications must be running simultaneously for the full system to work.

### 1. Start the Backend (Spring Boot)

Open the `backend` folder in **IntelliJ IDEA** and click the green **Run** button.

Or via terminal:
```bash
cd backend
mvn spring-boot:run
```

Backend starts at: `http://localhost:8080`

On first startup Hibernate auto-creates all Oracle tables and seeds 5 default branches.

---

### 2. Start the Customer Feedback App

```bash
cd feedback-app
npm install
npm start
```

Customer portal starts at: `http://localhost:3000`

Customers access their personalized feedback form via:
```
http://localhost:3000/feedback?ref=<TOKEN>
```

---

### 3. Start the Admin Dashboard

```bash
cd admin-dashboard
npm install
npm start
```

If port 3000 is taken, create `admin-dashboard/.env`:
```
PORT=3001
```

Admin dashboard starts at: `http://localhost:3001`

Login with: `admin` / `Admin@2026`

---

## Features

### Customer Feedback Form (`feedback-app`)
- Mobile-optimized responsive design
- **English and Indonesian** language support
- Three mandatory star ratings (1–5):
  - Customer Service quality
  - Branch Environment satisfaction
  - Likelihood to Recommend LOLC
- Optional additional comments
- Accessed via unique SMS token link
- Automatically tracks link opened and completed events

### Admin Dashboard (`admin-dashboard`)

**Analytics Tab**
- KPI summary cards: Total Feedback, Average Rating, NPS Score, Total Responses
- Monthly feedback trend line charts
- Rating distribution breakdown by question category
- Service type distribution (Loans, Savings, Insurance, Leasing)
- Branch performance leaderboard with rankings and badges
- Paginated feedback response table with search and filters
- CSV export functionality
- Filters by branch, rating, service type, and date range

**Send Links Tab**
- Send personalized SMS feedback links to customers
- Enter employee number + customer mobile to trigger SMS via Notify.lk
- Real-time link status tracking: `PENDING → SENT → OPENED → COMPLETED`
- Filter links by status and employee
- Employee management (add and list employees)

**Employee Performance Tab**
- Ranked leaderboard of all employees by average customer rating
- Medal indicators for top 3 performers (🥇 🥈 🥉)
- Completion rate progress bars
- Performance badges: Excellent / Good / Average / Needs Improvement
- Filter by branch and employee name

### Backend Services
- JWT-based stateless authentication (24-hour tokens)
- Feedback link token generation and lifecycle management
- SMS dispatch via Notify.lk with Sri Lanka mobile number formatting
- External API for integration with other LOLC systems
- Oracle DB persistence via Spring Data JPA / Hibernate

---

## API Reference

### Public Endpoints (No authentication required)

#### Submit Customer Feedback
```
POST /api/feedback
```
```json
{
  "customerService": 5,
  "branchEnvironment": 4,
  "recommendation": 5,
  "additionalComments": "Excellent service.",
  "branchId": "1",
  "branchName": "Colombo Main",
  "serviceType": "Loans"
}
```

#### Get All Branches
```
GET /api/branches
```

#### Admin Login
```
POST /api/auth/login
```
```json
{
  "username": "admin",
  "password": "Admin@2026"
}
```
Returns a JWT token valid for 24 hours.

#### Mark Link as Opened
```
POST /api/links/{token}/opened
```

#### Mark Link as Completed
```
POST /api/links/{token}/completed
```

---

### Admin Endpoints (Bearer JWT token required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/send-link` | Send SMS feedback link to customer |
| GET | `/api/admin/feedback-links` | List all feedback links |
| GET | `/api/admin/feedback-links/summary` | Link statistics summary |
| POST | `/api/admin/employees` | Add a new employee |
| GET | `/api/admin/employees` | List all employees |
| GET | `/api/admin/employee-performance` | Employee performance rankings |
| GET | `/api/analytics/summary` | KPI metrics |
| GET | `/api/analytics/trends` | Monthly trend data |
| GET | `/api/analytics/rating-distribution` | Rating breakdown by category |
| GET | `/api/analytics/branch-performance` | Per-branch performance scores |
| GET | `/api/analytics/service-distribution` | Service type breakdown |
| GET | `/api/responses` | Paginated feedback list |
| GET | `/api/responses/export` | Download feedback as CSV |

#### Send Link — Request Body
```json
{
  "employeeNumber": "EMP001",
  "customerMobile": "0771234567"
}
```

#### Add Employee — Request Body
```json
{
  "employeeNumber": "EMP001",
  "fullName": "Kasun Perera",
  "email": "kasun@lolc.com",
  "phone": "0771234567",
  "branchName": "Colombo"
}
```

---

### External API (API Key required)

For integration with other LOLC internal systems (e.g. Digital ME).

```
POST /api/external/send-feedback-link
Header: X-API-Key: LOLC-EXTERNAL-KEY-2026
```
```json
{
  "customerId": "CUST001",
  "employeeId": "EMP001",
  "customerMobile": "0771234567"
}
```

> The external API allows other LOLC platforms to trigger customer feedback SMS automatically upon completion of a service interaction, without requiring admin dashboard access.

---

## Configuration

### Backend — `backend/src/main/resources/application.properties`

```properties
# Oracle Database
spring.datasource.url=jdbc:oracle:thin:@localhost:1521:xe
spring.datasource.username=lolcadmin
spring.datasource.password=Admin2026
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver
spring.jpa.hibernate.ddl-auto=update

# JWT
app.jwt.secret=lolc-super-secret-jwt-key-2026-feedback-system
app.jwt.expiration=86400000

# CORS
app.cors.allowed-origins=http://localhost:3000,http://localhost:3001

# Notify.lk SMS
notify.lk.user-id=YOUR_USER_ID
notify.lk.api-key=YOUR_API_KEY
notify.lk.sender-id=YOUR_SENDER_ID

# External API Key
app.external.api-key=LOLC-EXTERNAL-KEY-2026

# Base URL for feedback links
app.feedback.base-url=http://localhost:3000
```

### Frontend Environment Variables

**`feedback-app/.env`**
```
REACT_APP_API_URL=http://localhost:8080
```

**`admin-dashboard/.env`**
```
REACT_APP_API_URL=http://localhost:8080
PORT=3001
```

---

## Security

| Feature | Implementation |
|---|---|
| Authentication | JWT stateless tokens (24-hour expiry) |
| Password Storage | BCrypt hashing |
| Admin API Protection | Bearer JWT token on all `/api/admin/**` and `/api/analytics/**` |
| External API Protection | API Key header `X-API-Key` |
| CORS | Restricted to configured origins only |
| Input Validation | Jakarta Bean Validation on all request bodies |
| SQL Injection Prevention | Spring Data JPA parameterized queries |
| Session Management | Stateless — no server-side sessions |

---

## Production Deployment Checklist

- [ ] Change `app.jwt.secret` to a strong random secret (min 32 characters)
- [ ] Change default admin password immediately after first login
- [ ] Set production CORS origins in `application.properties`
- [ ] Configure Oracle DB with strong credentials
- [ ] Register and approve Notify.lk Sender ID for SMS
- [ ] Change `app.external.api-key` to a strong secret key
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Build React apps with `npm run build` and serve via Nginx
- [ ] Run Spring Boot as a systemd service or Docker container
- [ ] Set `spring.jpa.hibernate.ddl-auto=validate` in production
- [ ] Set up log monitoring and alerting
- [ ] Configure database backups

---

## Notes

- The SMS feedback link token is unique per interaction — the customer mobile number and employee details are never exposed in the URL
- If Notify.lk Sender ID is pending approval, SMS is simulated and printed to the backend console for development testing
- The external API is designed for integration with LOLC internal systems such as Digital ME to automatically trigger feedback collection upon loan or service completion

---

*Developed for LOLC Holdings PLC — Internal Use Only*
