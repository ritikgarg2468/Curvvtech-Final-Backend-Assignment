# Smart Device Management Backend

This project is the **final round assignment for the Curvvtech Backend Developer role**.  
It is a **production-ready backend service** for managing smart devices, built with a focus on **performance, security, and scalability**.  

The application is built on **Node.js, Express, MongoDB, and Redis**, and is fully containerized with **Docker** for easy setup and deployment.

---

## 🚀 Objective
Enhance an existing Smart Device Management backend with **advanced features** that demonstrate **production-grade system design, security, and performance optimization**.

---

## ✅ Features Implemented

### Core Requirements

#### 1. API Performance & Caching (Redis)
- ✅ Caching for **device listings** (15–30 min TTL) and **user data**.  
- ✅ **Analytics queries** cached for **5 minutes**.  
- ✅ Cache invalidation on device updates.  
- ✅ Response time logging for slow endpoints.  
- ✅ Sub-100ms response time for cached device listings.  

#### 2. Advanced Authentication & Security
- ✅ **JWT-based authentication** with:  
  - Short-lived **access tokens** (15 mins).  
  - Long-lived **refresh tokens** (7 days).  
- ✅ Secure **token rotation** on refresh.  
- ✅ **Blacklist mechanism** for revoked refresh tokens.  
- ✅ Security headers via **helmet**.  
- ✅ **CORS configuration**.  
- ✅ **Rate limiting per endpoint** (stricter for auth, lenient for devices).  
- ✅ Request logging with **IP tracking**.  

#### 3. Real-time Device Status (WebSockets)
- ✅ **WebSocket server** for real-time device status updates.  
- ✅ Secure WebSocket connection authentication via **JWT**.  
- ✅ Broadcasting of **device events** (updates, heartbeats) within the same organization.  
- ✅ Graceful handling of dropped connections.  

#### 4. Data Export & Reporting (Async Jobs)
- ✅ API endpoint to trigger **async data exports**.  
- ✅ Background job processing using **Redis-backed Bull queue**.  
- ✅ Export formats: **CSV** and **JSON (with chart-ready data)**.  
- ✅ Simulated **email notification** (logged to console) on completion.  

---

### 🎁 Bonus Features
- ✅ **Database Optimization**  
  - Added **indexes** on frequently queried fields.  
  - Enabled **database connection pooling**.  
- ✅ **Error Handling & Monitoring**  
  - Structured JSON error responses with **error codes**.  
  - `/health` endpoint reporting DB + Redis status.  
  - `/metrics` endpoint exposing **request counts & response times**.  

---

## 🏗 Architecture Explanation
The backend is designed using a **modular, service-oriented architecture** ensuring maintainability, scalability, and testability.  

- **Express.js (Core & Routing):**  
  Handles HTTP requests. Routes separated by domain (auth, devices, exports).  
  Middleware ensures caching, authentication, rate-limiting, and logging.  

- **Business Logic Services:**  
  Encapsulated in service files (`auth.service.js`, `device.service.js`).  
  Controllers remain **thin** and only manage request/response cycles.  

- **Data & Persistence:**  
  - **MongoDB (Mongoose)** → Persistent storage of users, devices, tokens.  
  - **Redis** → Dual role:  
    - High-performance caching (devices, analytics).  
    - Message broker for Bull job queue.  

- **Real-time Communication:**  
  WebSocket server broadcasts **device updates/heartbeats** to clients in the same organization.  

---

## 📊 Architecture Diagram
graph TD
    subgraph Client
        A[User via Postman/WebApp]
    end

    subgraph Server Infrastructure
        B(Express API Gateway)
        C(Authentication Middleware)
        D(Caching Middleware)
        E{Controller Layer}
        F(Business Logic Services)
        G(Data Models)
    end
    
    subgraph Data Stores & Services
        H[(MongoDB)]
        I[(Redis Cache)]
        J((Bull Queue))
        K{{WebSocket Server}}
    end

    A --> B
    B --> C
    C --> D
    
    subgraph "Device Listing (GET /api/devices)"
        D --"Cache Miss"--> E
        D --"Cache Hit"--> I --"Cached Data"--> A
    end

    E --> F
    F --> G
    G --> H

    subgraph "Analytics (GET /api/analytics)"
        D --"Cache Check"--> I
        E --> F --> G --> H
    end

    subgraph "Device Update (PATCH /api/devices/:id)"
       F --"Invalidate Cache"--> I
    end

    subgraph "Data Export (POST /api/devices/export)"
        E --"Add Job to Queue"--> J
    end
    
    J --"Process Job"--> F
    
    subgraph "Real-time Communication"
        A --"WS Connection w/ JWT"--> K
        F --"Broadcast Event"--> K
    end


## 🛠 Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Mongoose ODM)  
- **Caching & Queuing:** Redis (ioredis + Bull)  
- **Real-time:** WebSockets (ws)  
- **Auth:** JWT (access + refresh tokens)  
- **Containerization:** Docker + Docker Compose  
- **Testing:** Jest, Supertest  

---

## ⚙️ Setup and Installation

### Prerequisites
- Git  
- Node.js (v18+)  
- Docker & Docker Compose  

### Local Development

# Clone repository
git clone [your-github-repo-url]
cd [your-repo-name]

# Setup environment
cp .env.example .env

# Install dependencies
npm install

# Run with Docker
docker-compose up --build
The API will be available at: **http://localhost:3000**

---

## 📚 API Documentation

### Authentication

#### `POST /api/auth/register`
Registers a new user.  
{
  "username": "user@example.com",
  "password": "password123",
  "organization": "MyOrg"
}

#### `POST /api/auth/login`
Logs in a user. Returns tokens.  

#### `POST /api/auth/refresh-token`
Generates new access + refresh tokens. Old refresh token is blacklisted.  

---

### Devices

#### `GET /api/devices`
Fetches all devices for user’s organization (**cached**).  

#### `PATCH /api/devices/:id`
Updates device properties → invalidates cache.  

---

### Analytics

#### `GET /api/analytics`
Returns **analytics data** (cached 5 mins).
{
  "activeDevices": 12,
  "offlineDevices": 3,
  "usageTrends": [ ... ]
}

### Data Export

#### `POST /api/devices/export`
Queues job for **CSV/JSON export**.
{
  "dateRange": {
    "start": "2025-08-01",
    "end": "2025-08-31"
  },
  "format": "csv" // or "json"
}

### Real-time Service
- **Endpoint:** `ws://localhost:3000`  
- **Auth:** pass `?token=<access_token>`  
- **Events:** `DEVICE_UPDATE`, `DEVICE_HEARTBEAT`  

---

### Health & Metrics
- `GET /health` → checks DB + Redis status.  
- `GET /metrics` → exposes request counts & response times.  

---

## 🧪 Running Tests

# Ensure containers are running
docker-compose up

# In another terminal
npm test

## 📈 Performance Benchmarks – Caching

| Metric            | Cache Miss (1st Req) | Cache Hit (2nd Req) | Improvement   |
|-------------------|----------------------|---------------------|---------------|
| Response Time     | ~185ms              | ~15ms              | ~92% faster   |
| Database Queries  | 1                   | 0                  | 100% reduction |

### Verification Steps
1. Login → get access token.  
2. Call `GET /api/devices` with token → header shows `X-Cache: MISS`.  
3. Repeat request → header shows `X-Cache: HIT` and faster response.  

---

## 🧪 Testing Evidence

### ✅ Unit & Integration Tests
PASS tests/device.test.js
PASS tests/auth.test.js

Test Suites: 2 passed, 2 total
Tests: 9 passed, 9 total
Snapshots: 0 total
Time: 5.28 s

---

---

## 📬 Postman Collection

A ready-to-use Postman collection is included in the repository:  

📂 **/postman/Curvvtech-Assignment.postman_collection.json**

### 🔹 Why it is included
- To make API testing **fast and reproducible** for reviewers.  
- Provides **predefined requests** for all core features:  
  - Authentication (register, login, refresh-token)  
  - Device APIs (list, update)  
  - Analytics (organization stats)  
  - Data Export (CSV/JSON)  
  - Health & Metrics endpoints  
  - WebSocket connection (manual test setup)  
- Saves time — no need to manually write requests in Postman.  

### 🔹 How to use
1. Open Postman.  
2. Click **Import → File**.  
3. Select `Curvvtech-Assignment.postman_collection.json`.  
4. Set the `{{baseUrl}}` environment variable to your API (e.g., `http://localhost:3000`).  
5. Authenticate → Copy the access token → Run other endpoints.  

---


## 👨‍💻 Developer
**Ritik Garg**  
📞 Mobile: [+91-9817861762]  
📧 Email: [ritikgarg2468@gmail.com]  

---

---

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](./LICENSE) file for details.

