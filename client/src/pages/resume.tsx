import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { Resume } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ResumePage() {
  const { toast } = useToast();
  const [resumeText, setResumeText] = useState("");

  const { data: resume, isLoading } = useQuery<Resume | null>({
    queryKey: ["/api/resume"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/resume", { rawText: text });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resume"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setResumeText("");
      toast({
        title: "Resume stored",
        description: "I'll use this for all future job evaluations until you update it.",
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
            : "Paste your resume below. I'll parse it and use it as your source of truth."}
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
              Uploading a new resume will replace the current one and recalculate all job match scores.
            </p>
            <Textarea
              placeholder="Paste your updated resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[120px] text-sm"
              data-testid="input-resume-update"
            />
            <Button
              className="mt-3"
              onClick={() => uploadMutation.mutate(resumeText)}
              disabled={!resumeText.trim() || uploadMutation.isPending}
              data-testid="button-update-resume"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-1" />
              )}
              Update Resume
            </Button>
          </Card>
        </div>
      ) : (
        <Card className="p-5">
          <div className="flex flex-col items-center text-center py-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-md bg-muted mb-4">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No resume uploaded</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-6">
              Paste your full resume text below. I'll extract your skills, experience, seniority level, industries, and tools.
            </p>
          </div>
          <Textarea
            placeholder="Paste your full resume text here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="min-h-[200px] text-sm"
            data-testid="input-resume-text"
          />
          <Button
            className="mt-3 w-full"
            onClick={() => uploadMutation.mutate(resumeText)}
            disabled={!resumeText.trim() || uploadMutation.isPending}
            data-testid="button-upload-resume"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-1" />
            )}
            {uploadMutation.isPending ? "Parsing Resume..." : "Upload & Parse Resume"}
          </Button>
        </Card>
      )}
    </div>
  );
}
