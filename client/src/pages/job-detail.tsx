import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  ExternalLink,
  Save,
  StickyNote,
  Trash2,
  MapPin,
  Globe,
  Send,
  MessageSquare,
  Gift,
  Ban,
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
  const [, setLocation] = useLocation();
  const jobId = parseInt(params.id || "0");
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [timeline, setTimeline] = useState({
    appliedDate: "",
    interviewDate: "",
    offerDate: "",
    rejectedDate: "",
  });
  const [timelineDirty, setTimelineDirty] = useState(false);

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
  });

  useEffect(() => {
    if (job) {
      setNotes(job.notes || "");
      setNotesDirty(false);
      setTimeline({
        appliedDate: job.appliedDate || "",
        interviewDate: (job as any).interviewDate || "",
        offerDate: (job as any).offerDate || "",
        rejectedDate: (job as any).rejectedDate || "",
      });
      setTimelineDirty(false);
    }
  }, [job]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      await apiRequest("PATCH", `/api/jobs/${jobId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Job removed", description: "The job has been removed from your tracker." });
      setLocation("/");
    },
    onError: () => {
      toast({ title: "Failed to remove job", variant: "destructive" });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (!job) return;
    const today = new Date().toISOString().split("T")[0];
    const isApplying = newStatus === "Applied" && !job.applied;
    const isInterviewing = newStatus === "Interview" && !timeline.interviewDate;
    const isOffer = newStatus === "Offer" && !timeline.offerDate;
    const isRejected = newStatus === "Rejected" && !timeline.rejectedDate;
    const patch: Record<string, unknown> = {
      status: newStatus,
      applied: isApplying ? true : job.applied,
      appliedDate: isApplying ? today : job.appliedDate ?? undefined,
    };
    if (isInterviewing) patch.interviewDate = today;
    if (isOffer) patch.offerDate = today;
    if (isRejected) patch.rejectedDate = today;
    updateMutation.mutate(patch);
    if (isApplying) toast({ title: "Marked as Applied" });
    if (isInterviewing) setTimeline(prev => ({ ...prev, interviewDate: today }));
    if (isOffer) setTimeline(prev => ({ ...prev, offerDate: today }));
    if (isRejected) setTimeline(prev => ({ ...prev, rejectedDate: today }));
  };

  const handleSaveNotes = () => {
    updateMutation.mutate({ notes }, {
      onSuccess: () => {
        setNotesDirty(false);
        toast({ title: "Notes saved" });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      },
    });
  };

  const handleSaveTimeline = () => {
    updateMutation.mutate({
      appliedDate: timeline.appliedDate || null,
      interviewDate: timeline.interviewDate || null,
      offerDate: timeline.offerDate || null,
      rejectedDate: timeline.rejectedDate || null,
    }, {
      onSuccess: () => {
        setTimelineDirty(false);
        toast({ title: "Timeline saved" });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      },
    });
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

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" data-testid="button-delete-job">
              <Trash2 className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground">Remove</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this job?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove "{job.title}" at {job.company} from your tracker. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                data-testid="button-confirm-delete"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

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
            {job.jobUrl && (
              <>
                <span className="text-muted-foreground">|</span>
                <a
                  href={job.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                  data-testid="link-job-url"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Original Post
                </a>
              </>
            )}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium text-sm" data-testid="text-job-location">{job.location}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Visa / Work Auth</p>
              <p className="font-medium text-sm" data-testid="text-job-visa">{job.visaSponsorship}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
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
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Posted</p>
              <p className="font-medium text-sm">{job.datePosted}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-medium text-sm">{job.deadline}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Application Timeline</h3>
          </div>
          {timelineDirty && (
            <Button size="sm" onClick={handleSaveTimeline} disabled={updateMutation.isPending} data-testid="button-save-timeline">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "appliedDate", label: "Applied", icon: Send, color: "text-blue-500" },
            { key: "interviewDate", label: "Interview", icon: MessageSquare, color: "text-yellow-500" },
            { key: "offerDate", label: "Offer Received", icon: Gift, color: "text-green-500" },
            { key: "rejectedDate", label: "Rejected", icon: Ban, color: "text-destructive" },
          ].map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="flex items-start gap-3">
              <div className={`mt-6 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input
                  type="date"
                  value={timeline[key as keyof typeof timeline]}
                  onChange={(e) => {
                    setTimeline(prev => ({ ...prev, [key]: e.target.value }));
                    setTimelineDirty(true);
                  }}
                  className="text-sm"
                  data-testid={`input-date-${key}`}
                />
              </div>
            </div>
          ))}
        </div>

        {(timeline.appliedDate || timeline.interviewDate || timeline.offerDate || timeline.rejectedDate) && (
          <>
            <Separator />
            <div className="flex items-center gap-0 overflow-x-auto pb-1">
              {[
                { key: "appliedDate", label: "Applied", icon: Send, color: "bg-blue-500" },
                { key: "interviewDate", label: "Interview", icon: MessageSquare, color: "bg-yellow-500" },
                { key: "offerDate", label: "Offer", icon: Gift, color: "bg-green-500" },
                { key: "rejectedDate", label: "Rejected", icon: Ban, color: "bg-destructive" },
              ].filter(({ key }) => timeline[key as keyof typeof timeline]).map(({ key, label, icon: Icon, color }, i, arr) => (
                <div key={key} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(timeline[key as keyof typeof timeline]).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-12 h-px bg-border mx-1 mb-5" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

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

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Your Notes</h3>
          </div>
          {notesDirty && (
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={updateMutation.isPending}
              data-testid="button-save-notes"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
        </div>
        <Textarea
          placeholder="Add your personal notes, comments, or follow-up reminders for this position..."
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesDirty(true);
          }}
          className="min-h-[100px] text-sm"
          data-testid="input-job-notes"
        />
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
