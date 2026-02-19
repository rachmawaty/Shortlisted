import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseResume, evaluateJob } from "./openai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Resume endpoints
  app.get("/api/resume", async (_req, res) => {
    try {
      const resume = await storage.getResume();
      res.json(resume);
    } catch (error) {
      console.error("Error fetching resume:", error);
      res.status(500).json({ message: "Failed to fetch resume" });
    }
  });

  app.post("/api/resume", async (req, res) => {
    try {
      const { rawText } = req.body;
      if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
        return res.status(400).json({ message: "Resume text is required" });
      }

      const parsed = await parseResume(rawText);
      const resume = await storage.upsertResume({
        rawText,
        skills: parsed.skills,
        experience: parsed.experience,
        seniorityLevel: parsed.seniorityLevel,
        industries: parsed.industries,
        tools: parsed.tools,
      });

      res.json(resume);
    } catch (error) {
      console.error("Error uploading resume:", error);
      res.status(500).json({ message: "Failed to parse and store resume" });
    }
  });

  // Job endpoints
  app.get("/api/jobs", async (_req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs/evaluate", async (req, res) => {
    try {
      const { rawDescription } = req.body;
      if (!rawDescription || typeof rawDescription !== "string" || rawDescription.trim().length === 0) {
        return res.status(400).json({ message: "Job description is required" });
      }

      const resume = await storage.getResume();
      if (!resume) {
        return res.status(400).json({ message: "Please upload your resume first" });
      }

      const evaluation = await evaluateJob(rawDescription, {
        skills: resume.skills,
        experience: resume.experience as any[],
        seniorityLevel: resume.seniorityLevel,
        industries: resume.industries,
        tools: resume.tools,
      });

      const job = await storage.createJob({
        title: evaluation.title,
        company: evaluation.company,
        industry: evaluation.industry,
        datePosted: evaluation.datePosted,
        deadline: evaluation.deadline,
        keyCapabilities: evaluation.keyCapabilities,
        matchingCapabilities: evaluation.matchingCapabilities,
        fitLevel: evaluation.fitLevel,
        strengths: evaluation.strengths,
        gaps: evaluation.gaps,
        verdict: evaluation.verdict,
        recommendation: evaluation.recommendation,
        applied: false,
        appliedDate: null,
        status: "Not Applied",
        rawDescription,
      });

      res.json(job);
    } catch (error) {
      console.error("Error evaluating job:", error);
      res.status(500).json({ message: "Failed to evaluate job" });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, applied, appliedDate } = req.body;
      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (applied !== undefined) updates.applied = applied;
      if (appliedDate !== undefined) updates.appliedDate = appliedDate;

      const job = await storage.updateJob(id, updates);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteJob(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  return httpServer;
}
