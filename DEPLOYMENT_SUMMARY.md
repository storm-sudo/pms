# 🚀 Deployment Summary & Feature Walkthrough

This document outlines the recent features added to **Synapse PMS** and is a step-by-step guide for deploying this Next.js application on **Render**.

---

## 🎨 Phase 1: Authentication (Email/Password)
We've introduced custom credentials instead of reliance on third-party OAuth APIs to strictly conform to strict corporate domain limits.

*   **Login & Registration**: Supports credential management.
*   **Safety Restriction Domain Policy**: Enforces email validation only ending securely with `@gmail.com` matching corporate domain handles (`*nt@gmail.com`).
*   **Sign Out Support**: Sidebar options to clear authentications safely.

---

## 📅 Phase 2: Overdue Automated Reminders (Resend API)
We've added automated task due date reminders to notify supervisors fully to prove complete control.

*   **Endpoint `/api/notify`**: Server setup utilizing Resend layout functions to send emails for tasks due today or strictly overdue.
*   **Background Monitor Controller**: Runs in dashboard layouts once per day, maps task assignees, alerts project leads. Provides rate-limit to avoid Inbox spams.

---

## 🔒 Phase 3: Access Control Validation Rules (RBAC)
We've reinforced visual updates checks to ensure stability standards:

| Component | Restrictions enforced |
| :--- | :--- |
| **Closing Projects** | Accessible to **Admins Only** (**YO**, **AR**, **SK**). |
| **Closing Tasks** | Accessible to **Admins Only** (**YO**, **AR**, **SK**). |
| **Closing Subtasks** | Accessible to **Supervisors** (Project Leads, Assignees). |

---

## 📝 Configuration Settings (`.env.local`)
Create an file to connect critical services securely on backend startups:

```bash
# RESEND API KEY FOR AUTOMATED EMAILS
RESEND_API_KEY=your_resend_api_key_here
```

---

## 🌐 Deployment Guidelines (Render)

To deploy this application seamlessly using Render's infrastructure, follow these instructions step-by-step:

### 1. Create a New Web Service
- Go to your **Render Dashboard**.
- Click **New** -> **Web Service**.
- Connect your GitHub Repository: `https://github.com/storm-sudo/pms`.

### 2. Configure Service Defaults
Make sure to specify these settings exactly:

| Attribute | Value |
| :--- | :--- |
| **Runtime** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm run start` |

### 3. Add Environment Variables
Navigate to the **Environment** tab on Render sidebar and append these:

- **Key**: `RESEND_API_KEY`
- **Value**: `[your_resend_api_key]` (Leave blank if you prefer logging simulations mode dry-run test loops).

### 4. Deploy!
Render will automatically compile the static Next.js paths. Your direct production router setup opens live instantly!
