# 🏫 School Management API

A complete backend API for managing a school ecosystem — including students, teachers, classes, campuses, attendance, marksheets, and user roles (Super Admin, Campus Admin, Teacher, Student).  
This system is built with **Node.js**, **Express**, and **MongoDB (Mongoose)** and supports **role-based authentication**, **email-based password reset**, **PDF/ZIP exports**, and **CSV downloads**.

---

## 🚀 Features

| Feature | Description |
|----------|-------------|
| 🧑‍💼 **Role-based Access Control** | Supports multiple user roles — `super-admin`, `campus-admin`, `teacher`, `student` with different permissions. |
| 🔐 **JWT Authentication** | JSON Web Tokens for secure login and session management. |
| 💌 **Password Reset via Gmail** | Forgot/reset password feature using Gmail with Nodemailer and secure reset tokens. |
| 🧾 **Marksheet Management** | Create, view, and export student marksheets; supports PDF generation and ZIP download for multiple students. |
| 🏫 **Campus Management** | Manage campuses and assign campus admins. |
| 🧑‍🏫 **Teacher & Student Management** | Add, update, and delete users under specific roles and campuses. |
| 📊 **Reports & CSV Export** | Download user data as CSV and marksheets as PDFs or zipped collections. |
| 📅 **Attendance Tracking** | Maintain attendance records for students (if implemented in repo). |
| ⚙️ **Validation Layer** | Robust input validation using **Joi** for request payloads. |
| 📚 **Logging Middleware** | Logs requests and responses for better observability and debugging. |
| 🛡️ **Error Handling** | Centralized error-handling middleware with meaningful HTTP responses. |

---

## 📁 Project Structure

```
School-Management-API/
│
├── config/            # Configuration files (database, environment)
├── controllers/       # All controller logic for each module
│   ├── authController.js
│   ├── marksheetController.js
│   ├── campusController.js
│   ├── classController.js
│   ├── attendanceController.js
│   └── ...
│
├── middlewares/       # Authentication, logging, error handling, validation
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── loggingMiddleware.js
│   └── validationMiddleware.js
│
├── models/            # Mongoose schemas and models
│   ├── User.js
│   ├── Marksheet.js
│   ├── Class.js
│   ├── Campus.js
│   ├── Subject.js
│   └── Attendance.js
│
├── routes/            # Express route definitions
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── marksheetRoutes.js
│   ├── campusRoutes.js
│   ├── classRoutes.js
│   └── ...
│
├── validators/        # Joi validation schemas
│   ├── authValidator.js
│   ├── marksheetValidator.js
│   ├── userValidator.js
│   └── ...
│
├── services/          # Reusable services (email, PDF generation, etc.)
│   ├── emailService.js
│   ├── pdfService.js
│   └── ...
│
├── utils/             # Helper utilities and constants
├── uploads/           # File uploads (if enabled)
├── index.js           # Entry point
└── package.json
```

---

## 🧠 Core Controllers Overview

### 🔑 Auth Controller
Handles:
- `register` — Register a new user (Super Admin, Campus Admin, Teacher, Student)
- `login` — Authenticate and issue JWT
- `getMe` — Get currently logged-in user
- `forgotPassword` — Send reset link via Gmail
- `resetPassword` — Reset password via token
- `updateUser`, `deleteUser`, `getUserById`, `getAllUsers` — Admin-level user management

---

### 📘 Marksheet Controller
Handles:
- `getStudentMarksheet` — Fetch marksheets by filters (role-based)
- Supports query filters: `studentId`, `classId`, `campusId`, `term`, `academicSession`
- Generates **individual PDF** per student
- Zips multiple PDFs into a single downloadable archive when `?downloadZIP=true`

---

### 🏫 Campus Controller
Handles:
- Create and manage campuses
- Assign and manage campus-admin users
- Ensure each campus has its respective admin and classes

---

### 🧑‍🏫 Class Controller
Handles:
- Create and manage classes (grade, section)
- Assign class teacher
- Manage class-student relationships

---

### 📚 Attendance Controller
Handles:
- Record attendance per class and date
- Supports multiple statuses (`present`, `absent`, `late`, etc.)
- Allows teachers or admins to view and export attendance

---

### 🧾 Subject Controller
Handles:
- Manage subject list per class/campus
- Associate with marksheets and grading system

---

## 🧩 Middlewares

| Middleware | Purpose |
|-------------|----------|
| **authMiddleware.js** | Verifies JWT and attaches user object (`req.user`) |
| **roleMiddleware.js** | Restricts access based on role |
| **validationMiddleware.js** | Runs Joi validation on incoming data |
| **loggingMiddleware.js** | Logs every request (method, path, status, duration) |
| **errorMiddleware.js** | Handles uncaught errors gracefully |

---

## ✅ Validators (Joi)

Validators ensure data integrity across all API inputs.

| Validator | Purpose |
|------------|----------|
| **authValidator.js** | Validate `register`, `login`, `forgotPassword`, and `resetPassword` payloads |
| **marksheetValidator.js** | Validate marksheet creation — requires valid student, class, and subjects array |
| **userValidator.js** | Validate user CRUD operations |
| **classValidator.js** | Validate class creation & update |
| **campusValidator.js** | Validate campus details |

---

## 📦 Main Dependencies

| Package | Description |
|----------|-------------|
| **express** | Web framework for Node.js |
| **mongoose** | MongoDB object modeling |
| **jsonwebtoken** | Authentication via JWT |
| **bcryptjs** | Password hashing |
| **joi** | Schema validation |
| **nodemailer** | Email sending for password reset |
| **json2csv** | Convert JSON data to CSV |
| **pdfkit / reportlab** | PDF generation for marksheets |
| **archiver** | Create ZIP files for multiple student PDFs |
| **dotenv** | Environment variable management |
| **morgan** | HTTP request logging (optional) |

---

## ⚙️ Environment Variables

Create a `.env` file in the root with:

```env
PORT=5000
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail@example.com
EMAIL_PASS=your_gmail_app_password
```

---

## 🧪 API Routes Summary

| Route | Method | Description | Protected |
|-------|--------|--------------|------------|
| `/api/auth/register` | POST | Register a user | ❌ |
| `/api/auth/login` | POST | Login user and return JWT | ❌ |
| `/api/auth/forgot-password` | POST | Send password reset email | ❌ |
| `/api/auth/reset-password/:token` | POST | Reset password | ❌ |
| `/api/users` | GET | Get all users (with filters, pagination, CSV export) | ✅ |
| `/api/users/:id` | GET | Get single user by ID | ✅ |
| `/api/users/:id` | PUT | Update user | ✅ |
| `/api/users/:id` | DELETE | Delete user | ✅ |
| `/api/marksheets` | GET | Fetch marksheets (supports `downloadZIP=true`) | ✅ |
| `/api/classes` | CRUD | Manage classes | ✅ |
| `/api/campuses` | CRUD | Manage campuses | ✅ |
| `/api/subjects` | CRUD | Manage subjects | ✅ |

---

## 💌 Password Reset Flow (Gmail)

1. **POST `/api/auth/forgot-password`**  
   Body: `{ "email": "user@example.com" }`  
   → Sends an email with reset link to Gmail.

2. **Email Content Example:**  
   ```
   Click below to reset your password:
   http://localhost:3000/api/auth/reset-password/<resetToken>
   ```

3. **POST `/api/auth/reset-password/:token`**  
   Body: `{ "newPassword": "NewSecure123" }`  
   → Verifies token, updates password, invalidates token.

---

## ⚙️ Run Locally

```bash
# Clone the repo
git clone https://github.com/Sheryaar-Ansar/School-Management-API.git
cd School-Management-API

# Install dependencies
npm install

# Start server
npm run dev
```

---

## 🧱 Technologies Used

- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT Authentication**
- **Nodemailer (Gmail SMTP)**
- **Joi Validation**
- **Archiver / PDFKit**
- **json2csv**
- **dotenv**, **morgan**, **bcryptjs**

---

## 🧭 Future Enhancements

- Integration with frontend dashboard  
- Graph-based analytics and attendance visualization  
- Role-based audit logs and activity tracking  
- Multi-language email templates  
- AWS S3 file uploads for reports  

---

## � Remaining / Implemented Features (details)

This project already includes many of the building blocks listed below. The sections summarize what's implemented and what you can enable or extend easily.

- Node-cron (scheduled jobs)
   - Purpose: automate monthly attendance report generation and weekly low-attendance checks.
   - Location: `cronJobs/cronJobs.js` calls `services/reportService.js`.
   - Notes: Cron schedule runs in server process — in production use a dedicated worker or external scheduler for reliability.

- Attendance reports & low-attendance checks
   - Purpose: Aggregation pipelines compute per-student attendance percentages and optionally email students when below threshold.
   - Location: `services/reportService.js`, `utils/nodemailer.js` (email templates), and a manual trigger route can be added for on-demand generation.

- AI study recommendations (OpenRouter integration)
   - Purpose: Generate short, personalized study recommendations using the OpenRouter API (model prompts tuned in code).
   - Location: `controllers/aiController.js`, `models/Score.js` (marksheet AI remarks), and `routes/aiRoutes.js`.
   - Notes: Requires `OPENROUTER_API_KEY` in environment variables.

- json2csv (CSV export)
   - Purpose: Convert user and report JSON data into CSV for admins/downloads.
   - Location: Implemented in `controllers/authController.js` (CSV export example for users).

- Nodemailer (email sending)
   - Purpose: Send password reset links and attendance reports via Gmail SMTP or other providers.
   - Location: `utils/nodemailer.js` and usages in `controllers/authController.js` and reporting services.
   - Notes: Requires SMTP credentials in `.env` (SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS).

- Password reset flow & archiver for attachments
   - Purpose: Password reset via time-limited JWT tokens. Archiver used to create ZIPs of marksheets for batch download.
   - Location: `controllers/authController.js` (forgot/reset password), `controllers/marksheetController.js` (PDF & ZIP export using `pdfkit` + `archiver`).

- Bcryptjs + JWT
   - Purpose: Password hashing and session/token management.
   - Location: `models/User.js` (pre-save hashing using `bcryptjs`), `controllers/authController.js` (login/jwt issuance).

- CRUD for campuses, classes, users, enrollments, assignments, exams, scores, attendance
   - Purpose: Full management endpoints for all core entities.
   - Location: See `controllers/` and `routes/` folders — most controllers and routes are scaffolded (auth, campus, class, enrollment, exam, score, attendance). Use standard RESTful patterns and validation middlewares already in place.

- Aggregation analytics & dashboard data
   - Purpose: Provide aggregate metrics for dashboards (attendance rates, top/bottom students, average scores per class, pass/fail statistics).
   - Location: `services/reportService.js` contains example aggregation queries; you can extend them into dedicated dashboard endpoints.

- Pagination & filtering
   - Purpose: Use query parameters for pagination and filtering across list endpoints (e.g., `?page=1&limit=20&role=teacher`).
   - Location: Implemented in several controllers (for example `controllers/authController.js` for users). Apply the same pattern to other list endpoints.

- PDFKit for marksheets
   - Purpose: Generate printable PDF marksheets per student and zip multiple marksheets for download.
   - Location: `controllers/marksheetController.js` (uses `pdfkit` and `archiver`).

- OpenRouter AI integration for study recommendations
   - Purpose: Short AI-generated study recommendations are created from student scores and included in marksheets or returned by endpoints.
   - Location: `config/openrouter.js`, `controllers/aiController.js`, and `models/Score.js` (AI remark generation during marksheet creation).






## �👨‍💻 Author

**Sheryaar Ansar**  **Saad Bin Khalid**
🌐[https://github.com/Saad0095](https://github.com/Saad0095)
🌐 [https://github.com/Sheryaar-Ansar](https://github.com/Sheryaar-Ansar)

---

> _“Empowering education management with structured simplicity.”_
