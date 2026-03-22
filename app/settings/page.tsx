"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Users, 
  Clock, 
  Target, 
  Zap,
  Mail,
  Slack,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  BarChart3
} from "lucide-react"

export default function SettingsPage() {
  const { currentUser, setTheme, theme } = useApp()
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [slackNotifications, setSlackNotifications] = useState(true)
  const [taskAssigned, setTaskAssigned] = useState(true)
  const [taskDueSoon, setTaskDueSoon] = useState(true)
  const [taskOverdue, setTaskOverdue] = useState(true)
  const [mandatoryEmailOnDueDate, setMandatoryEmailOnDueDate] = useState(true)
  const [dailyOverdueReminders, setDailyOverdueReminders] = useState(true)
  const [projectUpdates, setProjectUpdates] = useState(true)
  const [dailyDigest, setDailyDigest] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)
  
  // Accountability Settings
  const [autoEscalate, setAutoEscalate] = useState(true)
  const [escalationThreshold, setEscalationThreshold] = useState([24])
  const [requireBlockerReason, setRequireBlockerReason] = useState(true)
  const [mandatoryUpdates, setMandatoryUpdates] = useState(true)
  const [updateFrequency, setUpdateFrequency] = useState("daily")
  const [trackTimeEstimates, setTrackTimeEstimates] = useState(true)
  const [showVelocityMetrics, setShowVelocityMetrics] = useState(true)
  
  // Team Settings
  const [defaultAssignee, setDefaultAssignee] = useState("auto")
  const [workloadBalancing, setWorkloadBalancing] = useState(true)
  const [maxTasksPerPerson, setMaxTasksPerPerson] = useState([8])
  const [requireReviewer, setRequireReviewer] = useState(true)
  const [crossFunctionalVisibility, setCrossFunctionalVisibility] = useState(true)
  
  // Workflow Settings
  const [autoArchiveCompleted, setAutoArchiveCompleted] = useState(true)
  const [archiveAfterDays, setArchiveAfterDays] = useState([7])
  const [requireDueDate, setRequireDueDate] = useState(true)
  const [requirePriority, setRequirePriority] = useState(true)
  const [enableDependencies, setEnableDependencies] = useState(true)
  const [enableSubtasks, setEnableSubtasks] = useState(true)
  const [enableTimeTracking, setEnableTimeTracking] = useState(true)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure Synapse for your high-performance team
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="accountability" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="accountability" className="gap-2">
              <Target className="h-4 w-4" />
              Accountability
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <Zap className="h-4 w-4" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Accountability Settings */}
          <TabsContent value="accountability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Escalation Rules
                </CardTitle>
                <CardDescription>
                  Configure automatic escalation for blocked or overdue tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-escalate blocked tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically notify leads when tasks are blocked
                    </p>
                  </div>
                  <Switch checked={autoEscalate} onCheckedChange={setAutoEscalate} />
                </div>
                
                {autoEscalate && (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <Label>Escalation threshold (hours)</Label>
                      <Badge variant="secondary">{escalationThreshold[0]}h</Badge>
                    </div>
                    <Slider
                      value={escalationThreshold}
                      onValueChange={setEscalationThreshold}
                      min={4}
                      max={72}
                      step={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tasks blocked for longer than {escalationThreshold[0]} hours will be escalated
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require blocker reason</Label>
                    <p className="text-sm text-muted-foreground">
                      Force team members to explain why a task is blocked
                    </p>
                  </div>
                  <Switch checked={requireBlockerReason} onCheckedChange={setRequireBlockerReason} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Progress Updates
                </CardTitle>
                <CardDescription>
                  Enforce regular status updates from team members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mandatory progress updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Require team members to update task progress regularly
                    </p>
                  </div>
                  <Switch checked={mandatoryUpdates} onCheckedChange={setMandatoryUpdates} />
                </div>

                {mandatoryUpdates && (
                  <div className="space-y-3">
                    <Label>Update frequency</Label>
                    <Select value={updateFrequency} onValueChange={setUpdateFrequency}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every few hours</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="every-other-day">Every other day</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Track time estimates vs actuals</Label>
                    <p className="text-sm text-muted-foreground">
                      Compare estimated hours to actual time spent
                    </p>
                  </div>
                  <Switch checked={trackTimeEstimates} onCheckedChange={setTrackTimeEstimates} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show velocity metrics</Label>
                    <p className="text-sm text-muted-foreground">
                      Display team and individual velocity on dashboards
                    </p>
                  </div>
                  <Switch checked={showVelocityMetrics} onCheckedChange={setShowVelocityMetrics} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Configure what metrics are tracked and displayed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">Completion Rate</p>
                      <p className="text-xs text-muted-foreground">Track on-time delivery %</p>
                    </div>
                    <Switch defaultChecked className="ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Cycle Time</p>
                      <p className="text-xs text-muted-foreground">Time from start to done</p>
                    </div>
                    <Switch defaultChecked className="ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Blocker Frequency</p>
                      <p className="text-xs text-muted-foreground">Track recurring blockers</p>
                    </div>
                    <Switch defaultChecked className="ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Target className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Sprint Goals</p>
                      <p className="text-xs text-muted-foreground">Track goal achievement</p>
                    </div>
                    <Switch defaultChecked className="ml-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {currentUser?.email || "user@synapse.com"}
                      </p>
                    </div>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A154B]/10">
                      <Slack className="h-5 w-5 text-[#4A154B]" />
                    </div>
                    <div>
                      <p className="font-medium">Slack</p>
                      <p className="text-sm text-muted-foreground">#synapse-notifications</p>
                    </div>
                  </div>
                  <Switch checked={slackNotifications} onCheckedChange={setSlackNotifications} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>
                  Select which events trigger notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task assigned to me</Label>
                    <p className="text-sm text-muted-foreground">When a new task is assigned</p>
                  </div>
                  <Switch checked={taskAssigned} onCheckedChange={setTaskAssigned} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task due soon</Label>
                    <p className="text-sm text-muted-foreground">24 hours before deadline</p>
                  </div>
                  <Switch checked={taskDueSoon} onCheckedChange={setTaskDueSoon} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task overdue</Label>
                    <p className="text-sm text-muted-foreground">When a task passes its deadline</p>
                  </div>
                  <Switch checked={taskOverdue} onCheckedChange={setTaskOverdue} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mandatory email on due date</Label>
                    <p className="text-sm text-muted-foreground">Email supervisor + member on due date</p>
                  </div>
                  <Switch checked={mandatoryEmailOnDueDate} onCheckedChange={setMandatoryEmailOnDueDate} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily overdue reminders</Label>
                    <p className="text-sm text-muted-foreground">Daily email until task completed</p>
                  </div>
                  <Switch checked={dailyOverdueReminders} onCheckedChange={setDailyOverdueReminders} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Project updates</Label>
                    <p className="text-sm text-muted-foreground">Status changes and milestones</p>
                  </div>
                  <Switch checked={projectUpdates} onCheckedChange={setProjectUpdates} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Digest & Reports</CardTitle>
                <CardDescription>
                  Scheduled summary notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily digest</Label>
                    <p className="text-sm text-muted-foreground">Summary at 8am every day</p>
                  </div>
                  <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly report</Label>
                    <p className="text-sm text-muted-foreground">Comprehensive report every Monday</p>
                  </div>
                  <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Settings */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Assignment</CardTitle>
                <CardDescription>
                  Configure how tasks are assigned to team members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Default assignment mode</Label>
                  <Select value={defaultAssignee} onValueChange={setDefaultAssignee}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-assign based on workload</SelectItem>
                      <SelectItem value="manual">Manual assignment only</SelectItem>
                      <SelectItem value="round-robin">Round-robin distribution</SelectItem>
                      <SelectItem value="skills">Skill-based matching</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Workload balancing</Label>
                    <p className="text-sm text-muted-foreground">
                      Warn when assigning to overloaded team members
                    </p>
                  </div>
                  <Switch checked={workloadBalancing} onCheckedChange={setWorkloadBalancing} />
                </div>

                {workloadBalancing && (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <Label>Max active tasks per person</Label>
                      <Badge variant="secondary">{maxTasksPerPerson[0]} tasks</Badge>
                    </div>
                    <Slider
                      value={maxTasksPerPerson}
                      onValueChange={setMaxTasksPerPerson}
                      min={3}
                      max={15}
                      step={1}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review & Approval</CardTitle>
                <CardDescription>
                  Configure review requirements for completed work
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require reviewer for completion</Label>
                    <p className="text-sm text-muted-foreground">
                      Tasks must be reviewed before marking complete
                    </p>
                  </div>
                  <Switch checked={requireReviewer} onCheckedChange={setRequireReviewer} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cross-functional visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow all team members to see all projects
                    </p>
                  </div>
                  <Switch checked={crossFunctionalVisibility} onCheckedChange={setCrossFunctionalVisibility} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Settings */}
          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Requirements</CardTitle>
                <CardDescription>
                  Configure mandatory fields for task creation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require due date</Label>
                    <p className="text-sm text-muted-foreground">
                      All tasks must have a deadline
                    </p>
                  </div>
                  <Switch checked={requireDueDate} onCheckedChange={setRequireDueDate} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require priority level</Label>
                    <p className="text-sm text-muted-foreground">
                      All tasks must be prioritized
                    </p>
                  </div>
                  <Switch checked={requirePriority} onCheckedChange={setRequirePriority} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Features</CardTitle>
                <CardDescription>
                  Enable or disable workflow features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task dependencies</Label>
                    <p className="text-sm text-muted-foreground">
                      Link tasks that depend on each other
                    </p>
                  </div>
                  <Switch checked={enableDependencies} onCheckedChange={setEnableDependencies} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Subtasks</Label>
                    <p className="text-sm text-muted-foreground">
                      Break down tasks into smaller pieces
                    </p>
                  </div>
                  <Switch checked={enableSubtasks} onCheckedChange={setEnableSubtasks} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Time tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Log time spent on tasks
                    </p>
                  </div>
                  <Switch checked={enableTimeTracking} onCheckedChange={setEnableTimeTracking} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Archiving</CardTitle>
                <CardDescription>
                  Configure automatic task archiving
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-archive completed tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      Move completed tasks to archive automatically
                    </p>
                  </div>
                  <Switch checked={autoArchiveCompleted} onCheckedChange={setAutoArchiveCompleted} />
                </div>

                {autoArchiveCompleted && (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <Label>Archive after</Label>
                      <Badge variant="secondary">{archiveAfterDays[0]} days</Badge>
                    </div>
                    <Slider
                      value={archiveAfterDays}
                      onValueChange={setArchiveAfterDays}
                      min={1}
                      max={30}
                      step={1}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Choose your preferred color scheme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                      theme === "light"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex h-16 w-full items-center justify-center rounded-md bg-white shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                      theme === "dark"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex h-16 w-full items-center justify-center rounded-md bg-slate-900 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dashboard Layout</CardTitle>
                <CardDescription>
                  Customize your dashboard view
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact view</Label>
                    <p className="text-sm text-muted-foreground">
                      Show more information in less space
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show activity heatmap</Label>
                    <p className="text-sm text-muted-foreground">
                      Display contribution graph on dashboard
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animate transitions</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable smooth animations throughout the app
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button size="lg" className="px-8" onClick={() => {
            toast({ title: 'Settings saved', description: 'Your changes have been saved successfully.' });
          }}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
