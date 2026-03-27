"use client"

import { useState, useMemo } from "react"
import { useApp, useUsers, useProjects, useTasks } from "@/lib/store"
import { TaskDetailPanel } from "@/components/task-detail-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar, Filter } from "lucide-react"
import { format, startOfWeek, addDays, differenceInDays, isWithinInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns"
import type { Task, Project } from "@/lib/types"

const priorityColors = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
}

const statusColors: Record<string, string> = {
  "todo": "bg-muted",
  "in-progress": "bg-primary",
  "blocked": "bg-destructive",
  "review": "bg-purple-500",
  "done": "bg-emerald-500",
}

export default function TimelinePage() {
  const { selectedTaskId, setSelectedTaskId } = useApp()
  const projects = useProjects()
  const tasks = useTasks()
  const users = useUsers()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [zoomLevel, setZoomLevel] = useState<"day" | "week" | "month">("week")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [filterUser, setFilterUser] = useState<string>("all")

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterProject !== "all" && task.projectId !== filterProject) return false
      if (filterUser !== "all" && !task.assigneeIds.includes(filterUser)) return false
      return true
    })
  }, [tasks, filterProject, filterUser])

  const dateRange = useMemo(() => {
    if (zoomLevel === "day") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end: addDays(start, 13) })
    } else if (zoomLevel === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end: addDays(start, 27) })
    } else {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(addWeeks(currentDate, 8))
      return eachDayOfInterval({ start, end })
    }
  }, [currentDate, zoomLevel])

  const navigate = (direction: "prev" | "next") => {
    const amount = zoomLevel === "day" ? 7 : zoomLevel === "week" ? 14 : 30
    setCurrentDate((prev) =>
      direction === "next" ? addDays(prev, amount) : addDays(prev, -amount)
    )
  }

  const getTaskPosition = (task: Task) => {
    const startDate = new Date(task.startDate || task.createdAt)
    // If no dueDate, default to startDate + 1 day so the task is still visible
    const endDate = task.dueDate ? new Date(task.dueDate) : new Date(startDate.getTime() + 86400000)
    const rangeStart = dateRange[0]
    const rangeEnd = dateRange[dateRange.length - 1]

    const taskStart = startDate < rangeStart ? rangeStart : startDate
    const taskEnd = endDate > rangeEnd ? rangeEnd : endDate

    if (taskEnd < rangeStart || taskStart > rangeEnd) return null

    const startOffset = Math.max(0, differenceInDays(taskStart, rangeStart))
    const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1)
    const totalDays = dateRange.length

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    }
  }

  const getProject = (projectId: string): Project | undefined => {
    return projects.find((p) => p.id === projectId)
  }

  const groupedByProject = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    filteredTasks.forEach((task) => {
      if (!grouped[task.projectId]) {
        grouped[task.projectId] = []
      }
      grouped[task.projectId].push(task)
    })
    return grouped
  }, [filteredTasks])

  const cellWidth = zoomLevel === "day" ? "w-12" : zoomLevel === "week" ? "w-8" : "w-4"

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Timeline</h1>
          <p className="text-sm text-muted-foreground">
            Gantt chart view of all tasks and milestones
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <Button
              variant={zoomLevel === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setZoomLevel("day")}
              className="h-7 px-2 text-xs"
            >
              Day
            </Button>
            <Button
              variant={zoomLevel === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setZoomLevel("week")}
              className="h-7 px-2 text-xs"
            >
              Week
            </Button>
            <Button
              variant={zoomLevel === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setZoomLevel("month")}
              className="h-7 px-2 text-xs"
            >
              Month
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="px-3"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1200px]">
          {/* Date Headers */}
          <div className="sticky top-0 z-10 flex border-b border-border bg-card">
            <div className="w-64 shrink-0 border-r border-border bg-card px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">Task / Project</span>
            </div>
            <div className="flex flex-1">
              {dateRange.map((date, i) => {
                const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                const showMonth = i === 0 || date.getDate() === 1

                return (
                  <div
                    key={i}
                    className={`${cellWidth} shrink-0 border-r border-border py-2 text-center ${
                      isWeekend ? "bg-muted/30" : "bg-card"
                    } ${isToday ? "bg-primary/10" : ""}`}
                  >
                    {zoomLevel !== "month" && (
                      <>
                        <div className="text-[10px] font-medium uppercase text-muted-foreground">
                          {format(date, "EEE")}
                        </div>
                        <div
                          className={`text-sm ${
                            isToday ? "font-bold text-primary" : "text-foreground"
                          }`}
                        >
                          {format(date, "d")}
                        </div>
                      </>
                    )}
                    {zoomLevel === "month" && showMonth && (
                      <div className="text-[10px] font-medium text-muted-foreground">
                        {format(date, "MMM")}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Task Rows */}
          <div>
            {Object.entries(groupedByProject).map(([projectId, projectTasks]) => {
              const project = getProject(projectId)
              if (!project) return null

              return (
                <div key={projectId} className="border-b border-border">
                  {/* Project Header */}
                  <div className="flex bg-muted/50">
                    <div className="flex w-64 shrink-0 items-center gap-2 border-r border-border px-4 py-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{project.name}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {projectTasks.length}
                      </Badge>
                    </div>
                    <div className="relative flex-1">
                      {/* Project timeline bar */}
                      {project.startDate && project.endDate && (
                        <div
                          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full opacity-30"
                          style={{
                            backgroundColor: project.color,
                            left: `${Math.max(
                              0,
                              (differenceInDays(new Date(project.startDate), dateRange[0]) /
                                dateRange.length) *
                                100
                            )}%`,
                            width: `${Math.min(
                              100,
                              (differenceInDays(
                                new Date(project.endDate),
                                new Date(project.startDate)
                              ) /
                                dateRange.length) *
                                100
                            )}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Tasks */}
                  {projectTasks.map((task) => {
                    const position = getTaskPosition(task)
                    const assignee = users.find((u) => task.assigneeIds.includes(u.id))

                    return (
                      <div
                        key={task.id}
                        className="group flex hover:bg-muted/30"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <div className="flex w-64 shrink-0 cursor-pointer items-center gap-2 border-r border-border px-4 py-2 pl-8">
                          <div
                            className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`}
                          />
                          <span className="truncate text-sm text-foreground">{task.title}</span>
                          {assignee && (
                            <div className="ml-auto h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                              {assignee.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                        </div>
                        <div className="relative flex-1 py-2">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex">
                            {dateRange.map((date, i) => {
                              const isWeekend = date.getDay() === 0 || date.getDay() === 6
                              const isToday =
                                format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                              return (
                                <div
                                  key={i}
                                  className={`${cellWidth} shrink-0 border-r border-border/50 ${
                                    isWeekend ? "bg-muted/20" : ""
                                  } ${isToday ? "bg-primary/5" : ""}`}
                                />
                              )
                            })}
                          </div>

                          {/* Task Bar */}
                          {position && (
                            <div
                              className={`absolute top-1/2 h-6 -translate-y-1/2 cursor-pointer rounded-md ${
                                statusColors[task.status]
                              } transition-all hover:scale-y-110 hover:shadow-md`}
                              style={{
                                left: position.left,
                                width: position.width,
                                minWidth: "20px",
                              }}
                            >
                              <div className="flex h-full items-center justify-center overflow-hidden px-2">
                                <span className="truncate text-[10px] font-medium text-white">
                                  {task.title}
                                </span>
                              </div>
                              {/* Progress indicator */}
                              {(task.progress ?? 0) > 0 && (
                                <div
                                  className="absolute bottom-0 left-0 h-1 rounded-b-md bg-white/30"
                                  style={{ width: `${task.progress}%` }}
                                />
                              )}
                            </div>
                          )}

                          {/* Dependencies */}
                          {task.dependencies?.map((depId) => {
                            const depTask = tasks.find((t) => t.id === depId)
                            if (!depTask) return null
                            const depPosition = getTaskPosition(depTask)
                            if (!depPosition || !position) return null
                            // Simplified dependency line (would need SVG for proper arrows)
                            return null
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Today Line */}
          <div
            className="pointer-events-none absolute top-0 z-20 h-full border-l-2 border-dashed border-primary/50"
            style={{
              left: `calc(16rem + ${
                (differenceInDays(new Date(), dateRange[0]) / dateRange.length) * 100
              }%)`,
            }}
          >
            <div className="absolute top-0 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                Today
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 border-t border-border bg-card/50 px-6 py-3">
        <span className="text-xs font-medium text-muted-foreground">Status:</span>
        <div className="flex items-center gap-4">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-sm ${color}`} />
              <span className="text-xs capitalize text-muted-foreground">
                {status.replace("-", " ")}
              </span>
            </div>
          ))}
        </div>
        <span className="ml-6 text-xs font-medium text-muted-foreground">Priority:</span>
        <div className="flex items-center gap-4">
          {Object.entries(priorityColors).map(([priority, color]) => (
            <div key={priority} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${color}`} />
              <span className="text-xs capitalize text-muted-foreground">{priority}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel />
    </div>
  )
}
