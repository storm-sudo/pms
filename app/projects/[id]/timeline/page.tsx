"use client"

import { useParams } from "next/navigation"
import { GanttView } from "@/components/gantt-view"

export default function ProjectTimelinePage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <div className="flex-1 overflow-hidden">
      <GanttView projectId={projectId} />
    </div>
  )
}
