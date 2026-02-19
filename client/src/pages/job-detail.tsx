import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import type { Job } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function getAgingDays(appliedDate: string | null): number | null {
  if (!appliedDate) return null;
  const applied = new Date(appliedDate);
  const now = new Date();
  return Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
}

export default function JobDetailPage() {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const jobId = parseInt(params.id || "0");

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ status, applied, appliedDate }: { status: string; applied?: boolean; appliedDate?: string }) => {
      await apiRequest("PATCH", `/api/jobs/${jobId}`, { status, applied, appliedDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (!job) return;
    const isApplying = newStatus === "Applied" && !job.applied;
    updateMutation.mutate({
      status: newStatus,
      applied: isApplying ? true : job.applied,
      appliedDate: isApplying ? new Date().toISOString().split("T")[0] : job.appliedDate ?? undefined,
    });
    if (isApplying) {
      toast({ title: "Marked as Applied" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-muted-foreground">Job not found.</p>
        <Link href="/">
          <Button variant="outline" className="mt-4" data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const aging = getAgingDays(job.appliedDate);
  const needsFollow = job.applied && aging !== null && aging > 14 && job.status !== "Rejected" && job.status !== "Offer";
  const FitIcon = job.fitLevel === "High" ? TrendingUp : job.fitLevel === "Medium" ? Minus : TrendingDown;
  const fitColor = job.fitLevel === "High" ? "text-primary" : job.fitLevel === "Medium" ? "text-muted-foreground" : "text-destructive";

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Link href="/">
        <Button variant="ghost" size="sm" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold" data-testid="text-job-title">{job.title}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              <span data-testid="text-job-company">{job.company}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">{job.industry}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={job.fitLevel === "High" ? "default" : job.fitLevel === "Medium" ? "secondary" : "destructive"}
            data-testid="badge-fit-level"
          >
            <FitIcon className="w-3 h-3 mr-1" />
            {job.fitLevel} Fit
          </Badge>
          <Badge
            variant={
              job.recommendation === "Apply"
                ? "default"
                : job.recommendation.includes("referral")
                  ? "secondary"
                  : "destructive"
            }
            data-testid="badge-recommendation"
          >
            {job.recommendation}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Posted</p>
              <p className="font-medium text-sm">{job.datePosted}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-medium text-sm">{job.deadline}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Select value={job.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="mt-0.5" data-testid="select-job-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Applied">Not Applied</SelectItem>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {needsFollow && (
        <Card className="p-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="text-sm font-medium">Follow-up recommended</p>
            <span className="text-xs text-muted-foreground ml-auto">{aging} days since application</span>
          </div>
        </Card>
      )}

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold">Key Capabilities Required (Top 5)</h3>
        <div className="space-y-1.5">
          {(job.keyCapabilities || []).map((cap, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Shield className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <span>{cap}</span>
            </div>
          ))}
        </div>

        <Separator />

        <h3 className="text-sm font-semibold">Matching Capabilities from Resume</h3>
        <div className="space-y-1.5">
          {(job.matchingCapabilities || []).length > 0 ? (
            (job.matchingCapabilities || []).map((cap, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span>{cap}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No direct matches found.</p>
          )}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold">Hiring Manager Assessment</h3>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Strengths</span>
          </div>
          <div className="space-y-1.5 ml-6">
            {(job.strengths || []).map((s, i) => (
              <p key={i} className="text-sm" data-testid={`text-strength-${i}`}>{s}</p>
            ))}
            {(!job.strengths || job.strengths.length === 0) && (
              <p className="text-sm text-muted-foreground">None identified.</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium">Weaknesses / Gaps</span>
          </div>
          <div className="space-y-1.5 ml-6">
            {(job.gaps || []).map((g, i) => (
              <p key={i} className="text-sm" data-testid={`text-gap-${i}`}>{g}</p>
            ))}
            {(!job.gaps || job.gaps.length === 0) && (
              <p className="text-sm text-muted-foreground">No significant gaps.</p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-2">Hiring Manager Verdict</h4>
          <p className="text-sm leading-relaxed" data-testid="text-verdict">{job.verdict}</p>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3">Original Job Description</h3>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto" data-testid="text-raw-description">
          {job.rawDescription}
        </div>
      </Card>
    </div>
  );
}
