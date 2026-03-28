"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Document as DocType } from "@/lib/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Shield, 
  Upload, 
  MoreVertical,
  Download,
  Eye,
  Tag,
  History,
  AlertCircle,
  Info,
  FolderOpen
} from 'lucide-react';
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface DocumentLibraryProps {
  projectId: string;
}

export function DocumentLibrary({ projectId }: DocumentLibraryProps) {
  const { 
    documents, 
    uploadDocument, 
    updateDocumentAccess, 
    addDocumentVersion, 
    submitDocumentForApproval,
    publishDocumentSnapshot,
    currentUser,
    users
  } = useApp();
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const availableTags = ["SOP", "Protocol", "Report", "Grant", "Compliance", "Clinical"];
  const leads = users.filter(u => u.role === 'lead' || u.role === 'admin');

  const projectDocs = documents.filter(d => {
    const matchesProject = d.projectId === projectId;
    const matchesTags = tagFilter.length === 0 || tagFilter.every(t => d.tags.includes(t));
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesTags && matchesSearch;
  });

  const isLeadOrAdmin = currentUser?.role === 'lead' || currentUser?.role === 'admin';

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    await uploadDocument(projectId, selectedFile, { 
      tags: ['Protocol'], // Default tags for now
      accessLevel: 'all' 
    });
    setIsUploading(false);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Document Library</h2>
          <p className="text-muted-foreground">Version-controlled laboratory protocols and SOPs.</p>
        </div>
        
        {isLeadOrAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="font-bold border-2 border-primary h-10 px-4">
                <Upload className="mr-2 h-4 w-4" />
                Upload Protocol
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tighter uppercase">Clinical Archive Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-6 pt-4">
                <div className="border-2 border-dashed rounded-lg p-10 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 text-primary" />
                      <span className="font-bold uppercase tracking-tight text-lg">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-bold uppercase">Select Laboratory Archive</p>
                      <p className="text-sm text-muted-foreground mt-2">Maximum file size: 50MB (PDF, DOCX, CSV)</p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Initial Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary hover:text-white transition-colors uppercase font-bold text-[10px]"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Access Restricted To</label>
                    <div className="flex gap-2">
                      <Badge className="bg-primary hover:bg-primary uppercase font-bold text-[10px]">All Personnel</Badge>
                      <Badge variant="outline" className="opacity-50 uppercase font-bold text-[10px]">Leads Only</Badge>
                    </div>
                  </div>
                </div>

                <Button disabled={!selectedFile || isUploading} className="w-full font-bold h-12 uppercase tracking-widest text-lg">
                  {isUploading ? "ARCHIVING..." : "Commit to Laboratory Repository"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-card border rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Search Clinical Archive</label>
          <div className="relative">
            <input 
              className="w-full bg-muted/30 border-2 border-muted h-10 px-3 pr-10 rounded-md font-bold uppercase text-sm tracking-tight focus:border-primary outline-none transition-all"
              placeholder="SEARCH BY PROTOCOL NAME OR ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-[2] w-full">
          <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Multi-Select Tactical Tags</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <Badge 
                key={tag} 
                variant={tagFilter.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer transition-all uppercase font-bold text-[10px] px-2 py-0.5 ${tagFilter.includes(tag) ? "bg-primary" : "hover:border-primary"}`}
                onClick={() => {
                  setTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                }}
              >
                {tag}
              </Badge>
            ))}
            {tagFilter.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold uppercase text-destructive" onClick={() => setTagFilter([])}>
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">DOCUMENT / CLASSIFICATION</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest">STATUS</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest">VERSION</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">LAST AUDIT</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground uppercase tracking-[0.2em] text-xs font-bold italic">
                  NO PROTOCOLS MATCHING CURRENT FILTERS
                </TableCell>
              </TableRow>
            ) : (
              projectDocs.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors group">
                  <TableCell className="font-medium flex items-center gap-4 py-4 pl-6">
                    <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/10 group-hover:bg-primary/10 transition-colors">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-tight text-sm">{doc.name}</span>
                        {doc.isPublished && (
                          <Badge className="h-4 text-[8px] bg-emerald-500 font-bold uppercase px-1">Portal Active</Badge>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {doc.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-primary uppercase tracking-tighter">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`font-bold text-[9px] uppercase tracking-widest px-1.5 h-5 ${
                        doc.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        doc.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        'bg-muted text-muted-foreground'
                      }`} 
                      variant="outline"
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono bg-muted/20 text-[10px] border-muted-foreground/10 px-1.5 h-5">
                      v{doc.version}.0
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground font-mono text-[10px]">
                    {format(new Date(doc.createdAt), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 font-bold uppercase tracking-tight border-2">
                        <DropdownMenuLabel className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest">TACTICAL ACTIONS</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')} className="cursor-pointer gap-2 py-2.5">
                          <Eye className="h-4 w-4 text-primary" /> View Clinical Protocol
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')} className="cursor-pointer gap-2 py-2.5">
                          <Download className="h-4 w-4 text-primary" /> Export Local Archive
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest">GOVERNANCE & AUDIT</DropdownMenuLabel>
                        
                        <DropdownMenuItem className="cursor-pointer gap-2 py-2.5" onClick={() => {}}>
                          <History className="h-4 w-4 text-amber-500" /> Inspect Version History
                        </DropdownMenuItem>

                        {doc.status === 'approved' && (
                          <DropdownMenuItem className="cursor-pointer gap-2 py-2.5" onClick={() => {}}>
                            <History className="h-4 w-4 text-emerald-500" /> Commit New Version
                          </DropdownMenuItem>
                        )}

                        {doc.status !== 'approved' && isLeadOrAdmin && (
                          <DropdownMenuItem className="cursor-pointer gap-2 py-2.5 text-emerald-500" onClick={() => {}}>
                            <Shield className="h-4 w-4" /> Finalize Audit (Approve)
                          </DropdownMenuItem>
                        )}
                        
                        {doc.status === 'approved' && !isLeadOrAdmin && (
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2 py-2.5 text-amber-500" 
                            onClick={() => {
                              const approver = leads.find(l => l.id !== currentUser?.id);
                              if (approver) submitDocumentForApproval(doc.id, approver.id);
                            }}
                          >
                            <Shield className="h-4 w-4" /> Submit for Peer Review
                          </DropdownMenuItem>
                        )}

                        {doc.status === 'approved' && isLeadOrAdmin && !doc.isPublished && (
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2 py-2.5 text-emerald-500" 
                            onClick={() => publishDocumentSnapshot(doc.id)}
                          >
                            <FolderOpen className="h-4 w-4" /> Release to Stakeholder Portal
                          </DropdownMenuItem>
                        )}
                        
                        {isLeadOrAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer gap-2 py-2.5 text-destructive">
                              <Shield className="h-4 w-4" /> RESTRICT ACCESS (ADMIN ONLY)
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
