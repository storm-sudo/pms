# Synapse PMS

Synapse is a high-performance Project Management System (PMS) built with Next.js 16 (Turbopack), TypeScript, and Supabase. It is designed to provide research teams with real-time collaboration, advanced task delegation, and centralized intelligence management.

## 🚀 Features
- **Real-time Sync**: Instant updates across clients using Supabase Postgres Changes.
- **Admin Control Center**: Batch task assignment and team workload management.
- **Research Intelligence**: Unified project notes and resource linking (ELN integration).
- **User Management**: Admin-governed registration and approval workflow.
- **Automated Reporting**: Daily digests and productivity tracking (via Resend).

## 🛠 Tech Stack
- **Frontend**: React 19, Next.js 16, Tailwind CSS 4, Radix UI.
- **Backend/DB**: Supabase (Postgres, Real-time).
- **Email**: Resend SDK.
- **Visuals**: Lucide Icons, Recharts.

## 🛠 Setup & Development
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Configure `.env.local` with Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   RESEND_API_KEY=your-resend-key
   ```
4. Run the development server: `npm run dev`.

## 📄 Documentation
Detailed technical reports and SOPs are located in the `.gemini/antigravity/brain/` directory (private artifacts).
- `system_status_report.md`: Current project status and feature roadmap.
- `SOP_Task_Assignment.md`: Operating procedures for the Admin Command Center.