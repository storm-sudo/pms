import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AppProvider } from '@/components/app-provider'
import { Sidebar } from '@/components/sidebar'
import { TaskDetailPanel } from '@/components/task-detail-panel'
import { ProjectNotesPanel } from '@/components/project-notes-panel'
import { UserProfilePanel } from '@/components/user-profile-panel'

const geist = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans',
});
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'BioTrack - NucleoVir Therapeutics',
  description: 'High-accountability Project Management System for biotech research teams',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <AppProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64">
              {children}
            </main>
            <TaskDetailPanel />
            <ProjectNotesPanel />
            <UserProfilePanel />
          </div>
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
