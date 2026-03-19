import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Upload,
  CheckCircle2,
  Briefcase,
  Wrench,
  Building2,
  BarChart3,
  GraduationCap,
  Loader2,
  RefreshCw,
  FileUp,
  X,
} from "lucide-react";
import type { Resume } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function DropZone({
  onFileSelect,
  selectedFile,
  onClear,
  isPending,
}: {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isPending: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-md border bg-muted/30" data-testid="selected-file-info">
        <FileText className="w-8 h-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(0)} KB
          </p>
        </div>
        {!isPending && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            data-testid="button-clear-file"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 transition-colors cursor-pointer ${
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover-elevate"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      data-testid="dropzone-resume"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
        data-testid="input-file-resume"
      />
      <FileUp className="w-10 h-10 text-muted-foreground mb-3" />
      <p className="text-sm font-medium mb-1">Drop your resume PDF here</p>
      <p className="text-xs text-muted-foreground">
        or click to browse files (PDF only, max 10 MB)
      </p>
    </div>
  );
}

export default function ResumePage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: resume, isLoading } = useQuery<Resume | null>({
    queryKey: ["/api/resume"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/resume", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to upload resume");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resume"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setSelectedFile(null);
      toast({
        title: "Resume stored",
        description: "Your PDF has been parsed. I'll use this for all future job evaluations.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to parse resume", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-md" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold" data-testid="text-resume-title">My Resume</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {resume
            ? "Your resume is stored. It's used for all job evaluations."
            : "Upload your resume as a PDF. I'll parse it and use it as your source of truth."}
        </p>
      </div>

      {resume ? (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Resume Stored</span>
              <span className="text-xs text-muted-foreground ml-auto">
                Uploaded {new Date(resume.createdAt).toLocaleDateString()}
              </span>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Seniority Level</span>
                </div>
                <Badge variant="secondary" data-testid="badge-seniority">{resume.seniorityLevel || "Not determined"}</Badge>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(resume.skills || []).map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-skill-${i}`}>
                      {skill}
                    </Badge>
                  ))}
                  {(!resume.skills || resume.skills.length === 0) && (
                    <span className="text-xs text-muted-foreground">No skills parsed</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Work Experience</span>
                </div>
                <div className="space-y-3">
                  {(resume.experience as any[] || []).map((exp: any, i: number) => (
                    <div key={i} className="text-sm" data-testid={`text-experience-${i}`}>
                      <p className="font-medium">{exp.title}</p>
                      <p className="text-muted-foreground">{exp.company} {exp.duration ? `| ${exp.duration}` : ""}</p>
                      {exp.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{exp.description}</p>
                      )}
                    </div>
                  ))}
                  {(!resume.experience || (resume.experience as any[]).length === 0) && (
                    <span className="text-xs text-muted-foreground">No experience parsed</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Education</span>
                </div>
                <div className="space-y-3">
                  {((resume.education as any[]) || []).map((edu: any, i: number) => (
                    <div key={i} className="text-sm" data-testid={`text-education-${i}`}>
                      <p className="font-medium">
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                        {edu.inProgress && <Badge variant="outline" className="ml-2 text-xs">In Progress</Badge>}
                      </p>
                      <p className="text-muted-foreground">
                        {edu.institution}{edu.graduationYear ? ` | ${edu.graduationYear}` : ""}
                      </p>
                    </div>
                  ))}
                  {(!(resume.education as any[]) || (resume.education as any[]).length === 0) && (
                    <span className="text-xs text-muted-foreground">No education parsed</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Industries</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(resume.industries || []).map((ind, i) => (
                    <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-industry-${i}`}>
                      {ind}
                    </Badge>
                  ))}
                  {(!resume.industries || resume.industries.length === 0) && (
                    <span className="text-xs text-muted-foreground">No industries detected</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tools & Technologies</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(resume.tools || []).map((tool, i) => (
                    <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-tool-${i}`}>
                      {tool}
                    </Badge>
                  ))}
                  {(!resume.tools || resume.tools.length === 0) && (
                    <span className="text-xs text-muted-foreground">No tools detected</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Update Resume</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Upload a new PDF to replace the current resume. This will recalculate all job match scores.
            </p>
            <DropZone
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              onClear={() => setSelectedFile(null)}
              isPending={uploadMutation.isPending}
            />
            <Button
              className="mt-3"
              onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
              disabled={!selectedFile || uploadMutation.isPending}
              data-testid="button-update-resume"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-1" />
              )}
              {uploadMutation.isPending ? "Parsing PDF..." : "Update Resume"}
            </Button>
          </Card>
        </div>
      ) : (
        <Card className="p-5">
          <div className="flex flex-col items-center text-center py-4 mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-md bg-muted mb-4">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1" data-testid="text-empty-state">No resume uploaded</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Upload your resume as a PDF. I'll extract your skills, experience, seniority level, industries, and tools.
            </p>
          </div>
          <DropZone
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            onClear={() => setSelectedFile(null)}
            isPending={uploadMutation.isPending}
          />
          <Button
            className="mt-3 w-full"
            onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
            disabled={!selectedFile || uploadMutation.isPending}
            data-testid="button-upload-resume"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-1" />
            )}
            {uploadMutation.isPending ? "Parsing PDF..." : "Upload & Parse Resume"}
          </Button>
        </Card>
      )}
    </div>
  );
}
