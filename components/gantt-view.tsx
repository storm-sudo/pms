"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useApp, useUsers, useProjects, useTasks } from "@/lib/store"
import { TaskDetailPanel } from "@/components/task-detail-panel"
import { toast } from "@/components/ui/use-toast"
import { toast as sonner } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar, Filter, Milestone as MilestoneIcon, Layers } from "lucide-react"
import { format, startOfWeek, addDays, differenceInDays, isWithinInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, parseISO, startOfDay } from "date-fns"
import type { Task, Project, Milestone, ProjectPhase, TaskDependency } from "@/lib/types"

// dnd-kit
import {
  DndContext,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
  Modifier
} from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"

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

interface GanttViewProps {
  projectId?: string
}

export function GanttView({ projectId }: GanttViewProps) {
  const { 
    selectedTaskId, 
    setSelectedTaskId, 
    milestones, 
    phases, 
    dependencies,
    updateTaskDates,
    updateMilestone,
    updateProjectPhase,
    addTaskDependency,
    removeTaskDependency
  } = useApp()
  
  const allProjects = useProjects()
  const allTasks = useTasks()
  const users = useUsers()
  
  const projects = useMemo(() => {
    if (projectId) return allProjects.filter(p => p.id === projectId)
    return allProjects
  }, [allProjects, projectId])

  const tasks = useMemo(() => {
    if (projectId) return allTasks.filter(t => t.projectId === projectId)
    return allTasks
  }, [allTasks, projectId])

  const [currentDate, setCurrentDate] = useState(new Date())
  const [zoomLevel, setZoomLevel] = useState<"day" | "week" | "month">("week")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [filterUser, setFilterUser] = useState<string>("all")
  
  // Local state for optimistic updates during drag
  const [draggedItem, setDraggedItem] = useState<{ id: string, type: 'task' | 'milestone' | 'phase', offset: number } | null>(null)

  const dateRange = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    if (zoomLevel === "day") {
      return eachDayOfInterval({ start, end: addDays(start, 13) })
    } else if (zoomLevel === "week") {
      return eachDayOfInterval({ start, end: addDays(start, 27) })
    } else {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(addWeeks(currentDate, 8))
      return eachDayOfInterval({ start: monthStart, end: monthEnd })
    }
  }, [currentDate, zoomLevel])

  const navigate = (direction: "prev" | "next") => {
    const amount = zoomLevel === "day" ? 7 : zoomLevel === "week" ? 14 : 30
    setCurrentDate((prev) =>
      direction === "next" ? addDays(prev, amount) : addDays(prev, -amount)
    )
  }

  const getPosition = (start: string | Date, end: string | Date) => {
    const startDate = startOfDay(new Date(start))
    const endDate = startOfDay(new Date(end))
    const rangeStart = startOfDay(dateRange[0])
    const rangeEnd = startOfDay(dateRange[dateRange.length - 1])

    const displayStart = startDate < rangeStart ? rangeStart : startDate
    const displayEnd = endDate > rangeEnd ? rangeEnd : endDate

    if (endDate < rangeStart || startDate > rangeEnd) return null

    const startOffset = Math.max(0, differenceInDays(displayStart, rangeStart))
    const duration = Math.max(1, differenceInDays(displayEnd, displayStart) + 1)
    const totalDays = dateRange.length

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    }
  }

  const groupedByProject = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    tasks.forEach((task) => {
      if (filterProject !== "all" && task.projectId !== filterProject) return
      if (filterUser !== "all" && !task.assigneeIds.includes(filterUser)) return
      
      if (!grouped[task.projectId]) {
        grouped[task.projectId] = []
      }
      grouped[task.projectId].push(task)
    })
    return grouped
  }, [tasks, filterProject, filterUser])

  const cellWidth = zoomLevel === "day" ? "w-12" : zoomLevel === "week" ? "w-8" : "w-4"

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const [type, id] = (active.id as string).split(':');
    
    // Calculate date shift based on pixels moved and cell width
    // This is a bit tricky with percentages, so we use the total timeline width
    const timelineWidth = 1200; // Estimated or captured from ref
    const totalDays = dateRange.length;
    const pixelPerDay = timelineWidth / totalDays;
    const daysShift = Math.round(delta.x / pixelPerDay);

    if (daysShift === 0) {
        setDraggedItem(null);
        return;
    }

    if (type === 'task') {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const newStart = addDays(new Date(task.startDate || task.createdAt), daysShift);
            const newEnd = addDays(new Date(task.dueDate || addDays(new Date(task.startDate || task.createdAt), 1)), daysShift);
            updateTaskDates(id, format(newStart, 'yyyy-MM-dd'), format(newEnd, 'yyyy-MM-dd'));
        }
    } else if (type === 'milestone') {
        const milestone = milestones.find(m => m.id === id);
        if (milestone) {
            const newDue = addDays(new Date(milestone.dueDate), daysShift);
            updateMilestone(id, { dueDate: format(newDue, 'yyyy-MM-dd') });
        }
    } else if (type === 'phase') {
        const phase = phases.find(p => p.id === id);
        if (phase) {
            const newStart = addDays(new Date(phase.startDate), daysShift);
            const newEnd = addDays(new Date(phase.endDate), daysShift);
            updateProjectPhase(id, { startDate: format(newStart, 'yyyy-MM-dd'), endDate: format(newEnd, 'yyyy-MM-dd') });
        }
    }

    setDraggedItem(null);
  };

  // Tracking task positions for dependency lines
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const dependencyLines = useMemo(() => {
    return dependencies.map(dep => {
        const pred = tasks.find(t => t.id === dep.predecessorTaskId);
        const succ = tasks.find(t => t.id === dep.successorTaskId);
        if (!pred || !succ) return null;
        
        const posPred = getPosition(pred.startDate || pred.createdAt, pred.dueDate || addDays(new Date(pred.startDate || pred.createdAt), 1));
        const posSucc = getPosition(succ.startDate || succ.createdAt, succ.dueDate || addDays(new Date(succ.startDate || succ.createdAt), 1));
        
        if (!posPred || !posSucc) return null;

        const predRef = taskRefs.current[pred.id];
        const succRef = taskRefs.current[succ.id];
        if (!predRef || !succRef) return null;

        const predRect = predRef.getBoundingClientRect();
        const succRect = succRef.getBoundingClientRect();
        const containerRect = predRef.closest('.overflow-auto')?.getBoundingClientRect();
        
        if (!containerRect) return null;

        const x1 = (parseFloat(posPred.left) + parseFloat(posPred.width)) / 100 * (dateRange.length * (zoomLevel === 'day' ? 48 : zoomLevel === 'week' ? 32 : 16));
        const y1 = predRef.offsetTop + 12; // 12 is half of task bar height (24px)
        const x2 = parseFloat(posSucc.left) / 100 * (dateRange.length * (zoomLevel === 'day' ? 48 : zoomLevel === 'week' ? 32 : 16));
        const y2 = succRef.offsetTop + 12;

        return { id: `${dep.predecessorTaskId}-${dep.successorTaskId}`, x1, y1, x2, y2 };
    }).filter(Boolean);
  }, [dependencies, tasks, dateRange, zoomLevel, draggedItem]);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string } | null>(null);
  const [resizing, setResizing] = useState<{ id: string, edge: 'left' | 'right', startX: number, originalStart: string, originalEnd: string } | null>(null);
  const resizeRef = useRef<{ id: string, edge: 'left' | 'right', startX: number, originalStart: string, originalEnd: string } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, id: string, edge: 'left' | 'right', currentStart: string, currentEnd: string) => {
    e.preventDefault();
    e.stopPropagation();
    const data = { id, edge, startX: e.clientX, originalStart: currentStart, originalEnd: currentEnd };
    setResizing(data);
    resizeRef.current = data;
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const dayWidth = zoomLevel === 'day' ? 48 : zoomLevel === 'week' ? 100 : 200;

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizeRef.current) return;
    const { id, edge, startX, originalStart, originalEnd } = resizeRef.current;
    const deltaX = e.clientX - startX;
    const daysShift = Math.round(deltaX / dayWidth);
    
    if (daysShift === 0) return;

    if (edge === 'left') {
      const newStart = format(addDays(new Date(originalStart), daysShift), 'yyyy-MM-dd');
      if (newStart <= originalEnd) {
        updateProjectPhase(id, { startDate: newStart });
      }
    } else {
      const newEnd = format(addDays(new Date(originalEnd), daysShift), 'yyyy-MM-dd');
      if (newEnd >= originalStart) {
        updateProjectPhase(id, { endDate: newEnd });
      }
    }
  };

  const handleResizeEnd = () => {
    setResizing(null);
    resizeRef.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    sonner.success('Phase Adjusted', { description: 'Research timeline updated successfully.' });
  };

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, taskId });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {projectId ? `Project Schedule` : `Laboratory Timeline`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {projectId ? `Gantt view of project clinical tasks and milestones` : `Gantt chart view of all laboratory tasks and milestones`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!projectId && (
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {allProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            {["day", "week", "month"].map((level) => (
              <Button
                key={level}
                variant={zoomLevel === level ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setZoomLevel(level as any)}
                className="h-7 px-2 text-xs"
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
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

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToHorizontalAxis]}>
        {/* Timeline Grid */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-[1200px] relative">
            {/* SVG Layer for Dependencies */}
            <svg className="absolute inset-0 pointer-events-none z-0 overflow-visible w-full h-full">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                    </marker>
                </defs>
                {dependencyLines.map(line => line && (
                    <path
                        key={line.id}
                        d={`M ${line.x1} ${line.y1} L ${line.x1 + 10} ${line.y1} L ${line.x1 + 10} ${line.y2} L ${line.x2} ${line.y2}`}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                        strokeDasharray="4"
                        markerEnd="url(#arrowhead)"
                        className="opacity-50"
                    />
                ))}
            </svg>

            {/* Date Headers */}
            <div className="sticky top-0 z-30 flex border-b border-border bg-card">
              <div className="w-64 shrink-0 border-r border-border bg-card px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">Laboratory Entity</span>
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

            {/* Content Rows */}
            <div className="z-10 relative">
              {projects.map((project) => (
                <div key={project.id} className="border-b border-border">
                  {/* Project / Phase Header */}
                  <div className="flex bg-muted/50 items-center">
                    <div className="flex w-64 shrink-0 items-center gap-2 border-r border-border px-4 py-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                      <span className="text-sm font-medium text-foreground truncate">{project.name}</span>
                    </div>
                    <div className="relative flex-1 h-10">
                        {/* Project Phases */}
                        {phases.filter(p => p.projectId === project.id).map(phase => {
                            const pos = getPosition(phase.startDate, phase.endDate);
                            if (!pos) return null;
                            return (
                                <DraggableItem key={phase.id} id={`phase:${phase.id}`} className="absolute top-2 h-6 rounded-full opacity-60 flex items-center px-8"
                                    style={{ left: pos.left, width: pos.width, backgroundColor: phase.color }}>
                                    {/* Left Handle */}
                                    <div className="absolute left-0 top-0 w-6 h-full cursor-ew-resize hover:bg-white/20 rounded-l-full transition-colors z-10" 
                                        onMouseDown={(e) => handleResizeStart(e, phase.id, 'left', phase.startDate, phase.endDate)} 
                                    />
                                    <Layers className="h-3 w-3 mr-2 text-white shrink-0" />
                                    <span className="text-[10px] font-bold text-white truncate pointer-events-none">{phase.name}</span>
                                    {/* Right Handle */}
                                    <div className="absolute right-0 top-0 w-6 h-full cursor-ew-resize hover:bg-white/20 rounded-r-full transition-colors z-10" 
                                        onMouseDown={(e) => handleResizeStart(e, phase.id, 'right', phase.startDate, phase.endDate)} 
                                    />
                                </DraggableItem>
                            )
                        })}
                    </div>
                  </div>

                  {/* Tasks & Milestones */}
                  {tasks.filter(t => t.projectId === project.id).map((task) => {
                    const pos = getPosition(task.startDate || task.createdAt, task.dueDate || addDays(new Date(task.startDate || task.createdAt), 1));
                    const assignee = users.find((u) => task.assigneeIds.includes(u.id))

                    return (
                      <div key={task.id} className="group flex hover:bg-muted/30 transition-colors" onClick={() => setSelectedTaskId(task.id)}>
                        <div className="flex w-64 shrink-0 cursor-pointer items-center gap-2 border-r border-border px-4 py-2 pl-8">
                          <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />
                          <span className="truncate text-xs text-foreground">{task.title}</span>
                        </div>
                        <div className="relative flex-1 py-1 h-10" ref={el => { taskRefs.current[task.id] = el }}>
                           {/* Grid lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {dateRange.map((date, i) => (
                                    <div key={i} className={`${cellWidth} shrink-0 border-r border-border/30`} />
                                ))}
                            </div>
                           {/* Task Bar */}
                           {pos && (
                                <DraggableItem id={`task:${task.id}`} className={`absolute top-1/2 -translate-y-1/2 h-6 cursor-pointer rounded-md ${statusColors[task.status]} transition-transform hover:scale-y-110 shadow-sm flex items-center px-2`}
                                    style={{ left: pos.left, width: pos.width, minWidth: "24px" }}
                                    onContextMenu={(e: any) => handleContextMenu(e, task.id)}>
                                    <span className="truncate text-[10px] font-medium text-white">{task.title}</span>
                                </DraggableItem>
                           )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Milestones for this project */}
                  <div className="flex bg-card/30 items-center">
                    <div className="w-64 shrink-0 border-r border-border px-4 py-1 pl-8 flex items-center gap-2 h-10">
                        <MilestoneIcon className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Milestones</span>
                    </div>
                    <div className="relative flex-1 h-10">
                        {milestones.filter(m => m.projectId === project.id).map(milestone => {
                             const pos = getPosition(milestone.dueDate, milestone.dueDate);
                             if (!pos) return null;
                             return (
                                 <DraggableItem key={milestone.id} id={`milestone:${milestone.id}`} className="absolute top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center cursor-pointer"
                                     style={{ left: pos.left }}>
                                     <div className={`h-4 w-4 rotate-45 border-2 ${milestone.status === 'completed' ? 'bg-emerald-500 border-emerald-600' : 'bg-amber-500 border-amber-600'} shadow-lg`} title={milestone.name} />
                                 </DraggableItem>
                             )
                        })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Today Line */}
            <div
              className="pointer-events-none absolute top-0 z-40 h-full border-l-2 border-dashed border-primary/50"
              style={{
                left: `calc(16rem + ${(differenceInDays(new Date(), dateRange[0]) / dateRange.length) * 100}%)`,
              }}
            >
              <div className="absolute top-0 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">Today</div>
            </div>
          </div>
        </div>
      </DndContext>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-lg"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu(null)}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Manage Sequence</div>
          <div className="h-px bg-border my-1" />
          <Button variant="ghost" size="sm" className="w-full justify-start text-[10px] h-8" onClick={() => {
              // Open a dialog to choose successor
              sonner.info("Select Task", { description: "Click another task to set as successor." });
          }}>
            Set Successor Task
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-[10px] h-8 text-destructive hover:text-destructive" onClick={() => {
              // Remove dependencies where this is predecessor
              dependencies.filter(d => d.predecessorTaskId === contextMenu.taskId).forEach(d => {
                  removeTaskDependency(d.predecessorTaskId, d.successorTaskId);
              });
          }}>
            Clear Dependencies
          </Button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-8 border-t border-border bg-card px-6 py-4">
        <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-primary rounded-sm" />
            <span className="text-xs text-muted-foreground">Project Tasks</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-amber-500 rotate-45 border border-amber-600" />
            <span className="text-xs text-muted-foreground">Clinical Milestones</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-indigo-500 rounded-full opacity-60" />
            <span className="text-xs text-muted-foreground">Research Phases</span>
        </div>
      </div>

      <TaskDetailPanel />
    </div>
  )
}

function DraggableItem({ id, children, className, style, onContextMenu }: { id: string, children: React.ReactNode, className?: string, style?: any, onContextMenu?: (e: any) => void }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const dragStyle = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div 
            ref={setNodeRef} 
            style={{ ...style, ...dragStyle }} 
            {...listeners} 
            {...attributes} 
            className={className}
            onContextMenu={onContextMenu}
        >
            {children}
        </div>
    );
}
