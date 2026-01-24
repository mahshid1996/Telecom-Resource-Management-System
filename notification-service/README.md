# Notification Service

A **Notification Service** built with Node.js, Express, MongoDB, and Redis. It allows sending emails to multiple recipients, tracking delivery status, and generating CSV reports of email notifications.

## Table of Contents

1. [Technologies Used](#technologies-used)
2. [Features](#features)
3. [Architecture & Workflow](#architecture--workflow)
4. [API Endpoints](#api-endpoints)
5. [Running the Project](#running-the-project)
6. [Automated Testing](#automated-testing)

## Technologies Used

* **Node.js** – JavaScript runtime for backend development
* **Express.js** – Web framework for building REST APIs
* **MongoDB** – NoSQL database for storing notifications and reports
* **Mongoose** – ODM for MongoDB
* **Redis** – Queue system to process email sending asynchronously
* **Bull** – Redis-based queue library
* **Nodemailer** – Sending emails via Gmail OAuth2
* **json2csv** – Convert notification data to CSV in-memory
* **Helmet & CORS** – Security middlewares
* **Joi** – Input validation
* **Express-rate-limit** – Protect API from abuse

## Features

* Create a notification with multiple recipients
* Queue emails asynchronously with Redis & Bull
* Track email sending status (success / failure)
* Generate CSV reports dynamically without storing files on disk
* Download CSV reports via API



## Architecture & Workflow

1. **Client** sends a POST request to `/v1/notifications` with recipients, subject, and body.
2. **Express API** validates input and stores a **Notification document** in MongoDB.
3. The notification is added to a **Redis queue** using Bull.
4. **Worker process** sends emails using Nodemailer in chunks, updates delivery status in MongoDB, and generates a **Report document** with email statuses.
5. **Client** can fetch a CSV report of emails via `/api/reports/:notificationId`. The CSV is generated **in-memory**; no file is saved on disk.

---

## API Endpoints

### 1. Create Notification

**Request**

```bash
curl --location 'http://localhost:3000/v1/notifications' \
--header 'Content-Type: application/json' \
--data-raw '{
  "emailLists": ["malihehkanani7@gmail.com","mahshid.pourshojavahed@gmail.com"],
  "body": "mahshid",
  "subject": "dddddddddddddd"
}'
```

**Response**

```json
{
    "message": "Notification queued!",
    "notification": {
        "emailLists": [
            "malihehkanani7@gmail.com",
            "mahshid.pourshojavahed@gmail.com"
        ],
        "body": "mahshid",
        "subject": "dddddddddddddd",
        "status": "queued",
        "_id": "68fb99cf6e517ce4e722362f",
        "emailStatuses": [],
        "createdAt": "2025-10-24T15:22:55.050Z",
        "__v": 0,
        "notificationId": "68fb99cf6e517ce4e722362f"
    }
}
```

---

### 2. Get Report CSV

**Request**

```bash
curl --location 'http://localhost:3000/api/reports/68fb99cf6e517ce4e722362f'
```

**Response (CSV)**

```
"notificationId","email","status","subject"
"68fb99cf6e517ce4e722362f","mahshid.pourshojavahed@gmail.com","success","dddddddddddddd"
"68fb99cf6e517ce4e722362f","malihehkanani7@gmail.com","success","dddddddddddddd"
```

> The CSV is generated in-memory and returned as a downloadable file. No CSV file is stored on disk.

---

## Running the Project

1. Clone the repository

```bash
git clone <repo_url>
cd notification-service
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file with Gmail OAuth2 credentials

```env
GMAIL_SENDER=your-email@gmail.com
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_ACCESS_TOKEN=...
```

4. Start Redis server

```bash
redis-server
```

5. Run the project

```bash
node src/server.js
```

6. API will be available at `http://localhost:3000`

---

## Automated Testing

* You can add Jest or any testing framework to test API endpoints
* Example: test email sending or report generation without sending real emails using mocks
* Sample test commands:

watching test in browser: file:///D:/MyProject/notification-service/coverage/lcov-report/index.html
 npm run test:report

```bash
npm run test
```

