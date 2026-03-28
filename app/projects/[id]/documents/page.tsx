"use client";

import { use } from "react";
import { useApp } from "@/lib/store";
import { DocumentLibrary } from "@/components/document-library";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FolderOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function ProjectDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { projects } = useApp();
  
  const project = projects.find(p => p.id === id);
  if (!project) return notFound();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-4">
          <Link href={`/app/projects/${id}`}>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-3xl font-bold tracking-tight uppercase">{project.name}</h1>
            </div>
            <p className="text-muted-foreground">Document Repository & Clinical Archive</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <DocumentLibrary projectId={id} />
      </div>
    </div>
  );
}
