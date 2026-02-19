# LOLC Customer Feedback System

A full-stack customer feedback collection and analytics platform for LOLC Holdings PLC.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  CUSTOMER SIDE (Public)                                 │
│  QR Code → feedback.lolc.lk → Submit                   │
│  React + TypeScript (Mobile-optimized SPA)              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  SPRING BOOT BACKEND API (:8080)                        │
│                                                         │
│  POST /api/feedback           (public)                  │
│  GET  /api/branches           (public)                  │
│  POST /api/auth/login         (public)                  │
│  GET  /api/analytics/*        (JWT protected)           │
│  GET  /api/responses/*        (JWT protected)           │
│                                                         │
│  Features: JWT Auth, Rate Limiting, CORS, Validation    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  MONGODB DATABASE                                       │
│  Collections:                                           │
│  - feedback_responses                                   │
│  - branches                                             │
│  - admin_users                                          │
└─────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD (Internal)                             │
│  admin.lolc.lk — React + TypeScript + Recharts         │
│  Login → Analytics Dashboard → Feedback Table          │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
lolc-project/
├── feedback-app/           # Customer-facing feedback SPA
├── admin-dashboard/        # Admin analytics dashboard
└── backend/                # Spring Boot API
```

---

## Prerequisites

- **Java 17+**
- **Node.js 18+**
- **MongoDB 6+** (local or Atlas)
- **Maven 3.9+**

---

## Quick Start

### 1. Start MongoDB

```bash
# Local MongoDB
mongod --dbpath /data/db

# Or use MongoDB Atlas - update connection string in application.properties
```

### 2. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**

On first startup, it automatically seeds:
- **Admin user**: `admin` / `Admin@2026`
- **5 branches**: Colombo Main, Kandy, Galle, Negombo, Kurunegala

### 3. Start the Customer Feedback App

```bash
cd feedback-app
npm install
npm start
```

Runs on **http://localhost:3000**

### 4. Start the Admin Dashboard

```bash
cd admin-dashboard
npm install
npm start
```

Runs on **http://localhost:3001**
> Add `PORT=3001` to `admin-dashboard/.env` or run with `PORT=3001 npm start`

---

## Configuration

### Backend (`backend/src/main/resources/application.properties`)

```properties
# MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/lolc_feedback

# JWT (change in production!)
app.jwt.secret=LOLCFeedbackSecretKey2026VeryLongAndSecureSecretKeyForJWTSigning
app.jwt.expiration=86400000   # 24 hours

# CORS - add your production domains
app.cors.allowed-origins=http://localhost:3000,http://localhost:3001,https://feedback.lolc.lk,https://admin.lolc.lk
```

### Frontend Environment Variables

Create `.env` files if deploying to non-default URLs:

**feedback-app/.env**
```env
REACT_APP_API_URL=https://api.lolc.lk/api
```

**admin-dashboard/.env**
```env
REACT_APP_API_URL=https://api.lolc.lk/api
PORT=3001
```

---

## API Reference

### Public Endpoints

#### POST /api/feedback
Submit customer feedback.

**Request Body:**
```json
{
  "customerService": 5,
  "branchEnvironment": 4,
  "recommendation": 5,
  "additionalComments": "Great service!",
  "branchId": "branch_id_here",
  "serviceType": "Loans",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "feedbackId": "67abc..."
}
```

**Validation:**
- `customerService`: Required, 1-5
- `branchEnvironment`: Required, 1-5  
- `recommendation`: Required, 1-5
- `additionalComments`: Optional
- Rate limited: 20 submissions per IP per hour

#### GET /api/branches
Get all active branch locations.

#### POST /api/auth/login
Authenticate as admin.

**Request:**
```json
{ "username": "admin", "password": "Admin@2026" }
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresAt": "2026-02-20T12:00:00Z",
  "username": "admin"
}
```

### Protected Endpoints (Bearer Token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/responses` | Paginated feedback list |
| GET | `/api/responses/{id}` | Single feedback entry |
| GET | `/api/responses/export` | Download CSV |
| GET | `/api/analytics/summary` | Key metrics |
| GET | `/api/analytics/trends?months=12` | Monthly trend data |
| GET | `/api/analytics/rating-distribution` | Stacked bar data |
| GET | `/api/analytics/branch-performance` | Per-branch scores |
| GET | `/api/analytics/service-distribution` | Service type breakdown |

---

## Customer Feedback App Features

- **Mobile-first** responsive design
- **3 mandatory star ratings** (1-5 stars each):
  - Customer Service
  - Branch Environment
  - Likelihood to Recommend
- **Optional** additional comments textarea
- **3 language support**: English, Sinhala (සිංහල), Tamil (தமிழ்)
- Form validation with clear error states
- Loading state during submission
- Success confirmation screen

---

## Admin Dashboard Features

- **Login page** with JWT authentication
- **4 KPI cards**: Total Feedback, Average Rating, NPS Score, Response Rate
- **Collapsible chart sections**:
  - Feedback Trends (12-month line chart)
  - Rating Distribution by Category (stacked bar)
  - Branch Performance leaderboard
  - Branch Volume (bar chart)
  - Service Type Distribution (donut chart)
- **Feedback table** with search, filters, and pagination
- **Feedback detail modal** with full breakdown
- **CSV export** functionality
- **Filters**: Date range, Branch, Rating, Service Type

---

## Security Features

- JWT-based stateless authentication (24-hour tokens)
- BCrypt password hashing
- CORS configured for specific origins only
- Rate limiting: max 20 feedback submissions per IP per hour
- Input validation on all endpoints
- MongoDB injection prevention via Spring Data

---

## Production Deployment Checklist

- [ ] Change `app.jwt.secret` to a strong random secret
- [ ] Change default admin password immediately after first login
- [ ] Configure MongoDB with authentication
- [ ] Set production CORS origins
- [ ] Enable HTTPS (SSL certificates)
- [ ] Configure MongoDB Atlas or managed DB for production
- [ ] Build React apps: `npm run build` and serve via Nginx
- [ ] Run Spring Boot as a systemd service or Docker container
- [ ] Set up monitoring and log aggregation

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Customer App Frontend | React 18, TypeScript |
| Admin Dashboard Frontend | React 18, TypeScript, Recharts |
| Backend | Spring Boot 3.2, Java 17 |
| Database | MongoDB 6 |
| Authentication | JWT (JJWT library) |
| Security | Spring Security |
| Validation | Jakarta Bean Validation |
| Build | Maven (backend), CRA (frontend) |
