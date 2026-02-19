import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle2,
  Eye,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Trash2,
  ExternalLink,
  MapPin,
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

function FitBadge({ level }: { level: string }) {
  const variant =
    level === "High" ? "default" : level === "Medium" ? "secondary" : "destructive";
  const Icon = level === "High" ? TrendingUp : level === "Medium" ? Minus : TrendingDown;
  return (
    <Badge variant={variant} data-testid={`badge-fit-${level.toLowerCase()}`}>
      <Icon className="w-3 h-3 mr-1" />
      {level}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  testId,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  testId: string;
}) {
  return (
    <Card className="p-4" data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-2xl font-bold mt-1" data-testid={`${testId}-value`}>{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, applied, appliedDate }: { id: number; status: string; applied?: boolean; appliedDate?: string }) => {
      await apiRequest("PATCH", `/api/jobs/${id}`, { status, applied, appliedDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Job removed", description: "The job has been removed from your tracker." });
    },
    onError: () => {
      toast({ title: "Failed to remove job", variant: "destructive" });
    },
  });

  const totalJobs = jobs.length;
  const appliedJobs = jobs.filter((j) => j.applied).length;
  const highFit = jobs.filter((j) => j.fitLevel === "High").length;
  const needsFollowUp = jobs.filter((j) => {
    if (!j.applied || !j.appliedDate) return false;
    const aging = getAgingDays(j.appliedDate);
    return aging !== null && aging > 14 && j.status !== "Rejected" && j.status !== "Offer";
  }).length;

  const handleStatusChange = (job: Job, newStatus: string) => {
    const isApplying = newStatus === "Applied" && !job.applied;
    updateStatusMutation.mutate({
      id: job.id,
      status: newStatus,
      applied: isApplying ? true : job.applied,
      appliedDate: isApplying ? new Date().toISOString().split("T")[0] : job.appliedDate ?? undefined,
    });
    if (isApplying) {
      toast({ title: "Marked as Applied", description: `${job.title} at ${job.company}` });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div>
        <h2 className="text-xl font-semibold" data-testid="text-dashboard-title">
          Job Tracker
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your pipeline at a glance. Stop guessing, start tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={totalJobs}
          icon={BarChart3}
          description="All tracked positions"
          testId="stat-total"
        />
        <StatCard
          title="Applied"
          value={appliedJobs}
          icon={CheckCircle2}
          description={`${totalJobs > 0 ? Math.round((appliedJobs / totalJobs) * 100) : 0}% conversion`}
          testId="stat-applied"
        />
        <StatCard
          title="High Fit"
          value={highFit}
          icon={Target}
          description="Strong matches"
          testId="stat-high-fit"
        />
        <StatCard
          title="Follow-up Needed"
          value={needsFollowUp}
          icon={Bell}
          description="> 14 days since applied"
          testId="stat-follow-up"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2 p-4 border-b flex-wrap">
          <h3 className="text-sm font-semibold">Master Tracking Table</h3>
          <Link href="/add-job">
            <Button size="sm" data-testid="button-add-job">
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Job
            </Button>
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-md bg-muted mb-4">
              <BarChart3 className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1" data-testid="text-empty-state">No jobs tracked yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              Paste a job description to get a brutally honest evaluation and start building your pipeline.
            </p>
            <Link href="/add-job">
              <Button size="sm" data-testid="button-add-first-job">
                <PlusCircle className="w-4 h-4 mr-1" />
                Add Your First Job
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Job Title</TableHead>
                  <TableHead className="min-w-[120px]">Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Fit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aging</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const aging = getAgingDays(job.appliedDate);
                  const needsFollow = job.applied && aging !== null && aging > 14 && job.status !== "Rejected" && job.status !== "Offer";
                  return (
                    <TableRow key={job.id} data-testid={`row-job-${job.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/job/${job.id}`}>
                            <span className="font-medium text-sm hover:underline cursor-pointer" data-testid={`text-job-title-${job.id}`}>
                              {job.title}
                            </span>
                          </Link>
                          {job.jobUrl && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-job-url-${job.id}`}>
                                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>Open original job post</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-job-company-${job.id}`}>{job.company}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[140px]" data-testid={`text-job-location-${job.id}`}>{job.location}</span>
                        </div>
                      </TableCell>
                      <TableCell><FitBadge level={job.fitLevel} /></TableCell>
                      <TableCell>
                        <Select
                          value={job.status}
                          onValueChange={(val) => handleStatusChange(job, val)}
                        >
                          <SelectTrigger className="w-[130px]" data-testid={`select-status-${job.id}`}>
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
                      </TableCell>
                      <TableCell>
                        {job.applied && aging !== null ? (
                          <div className="flex items-center gap-1">
                            <span className={`text-sm ${needsFollow ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                              {aging}d
                            </span>
                            {needsFollow && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                                </TooltipTrigger>
                                <TooltipContent>Follow-up recommended</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            job.recommendation === "Apply"
                              ? "default"
                              : job.recommendation.includes("referral")
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs whitespace-nowrap"
                        >
                          {job.recommendation === "Apply"
                            ? "Apply"
                            : job.recommendation.includes("referral")
                              ? "Referral Only"
                              : "Skip"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Link href={`/job/${job.id}`}>
                            <Button size="icon" variant="ghost" data-testid={`button-view-job-${job.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" data-testid={`button-delete-job-${job.id}`}>
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
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
                                  onClick={() => deleteMutation.mutate(job.id)}
                                  data-testid="button-confirm-delete"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
