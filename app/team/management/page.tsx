"use client"

import { useState } from "react"
import { useApp, useIsAdmin } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  UserPlus,
  Mail,
  Building2
} from "lucide-react"

export default function UserManagementPage() {
  const { users, approveUser, rejectUser } = useApp()
  const isAdmin = useIsAdmin()
  const [searchQuery, setSearchQuery] = useState("")

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <CardHeader>
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">Access Denied</CardTitle>
            <CardDescription>
              Only system administrators can access user management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingUsers = filteredUsers.filter(u => u.status === 'pending')
  const approvedUsers = filteredUsers.filter(u => u.status === 'approved')
  const rejectedUsers = filteredUsers.filter(u => u.status === 'rejected')

  const UserTable = ({ data }: { data: typeof users }) => (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-medium">User</th>
            <th className="px-4 py-3 text-left font-medium">Department</th>
            <th className="px-4 py-3 text-left font-medium">Role</th>
            <th className="px-4 py-3 text-left font-medium">Joined</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                No users found.
              </td>
            </tr>
          ) : (
            data.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{user.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {user.email}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {user.department}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.joinedDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.status === 'pending' ? (
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => rejectUser(user.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Reject
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => approveUser(user.id)}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className={
                      user.status === 'approved' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-red-600 border-red-200 bg-red-50'
                    }>
                      {user.status === 'approved' ? 'Approved' : 'Rejected'}
                    </Badge>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Review registration requests and manage team access
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-emerald-500/5 border-emerald-500/10">
            <CardHeader className="pb-2">
              <CardDescription className="text-emerald-600 font-medium">Approved Users</CardDescription>
              <CardTitle className="text-3xl">{approvedUsers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-amber-500/5 border-amber-500/10">
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-600 font-medium">Pending Requests</CardDescription>
              <CardTitle className="text-3xl">{pendingUsers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-slate-500/5 border-slate-500/10">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-600 font-medium">Total Registrations</CardDescription>
              <CardTitle className="text-3xl">{users.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {pendingUsers.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 min-w-[1.25rem] text-[10px]">
                  {pendingUsers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              All Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <UserTable data={pendingUsers} />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <UserTable data={approvedUsers} />
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            <UserTable data={filteredUsers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
