import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseResume, evaluateJob } from "./openai";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .filter((item: any) => "str" in item)
      .map((item: any) => item.str)
      .join(" ");
    pages.push(text);
  }
  return pages.join("\n");
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/resume", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resume = await storage.getResume(userId);
      res.json(resume);
    } catch (error) {
      console.error("Error fetching resume:", error);
      res.status(500).json({ message: "Failed to fetch resume" });
    }
  });

  app.post("/api/resume", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let rawText = "";

      if (req.file) {
        rawText = await extractTextFromPdf(req.file.buffer);
      } else if (req.body.rawText) {
        rawText = req.body.rawText;
      }

      if (!rawText || rawText.trim().length === 0) {
        return res.status(400).json({ message: "Could not extract text from the PDF. Please try a different file." });
      }

      const parsed = await parseResume(rawText);
      const resume = await storage.upsertResume({
        userId,
        rawText,
        skills: parsed.skills,
        experience: parsed.experience,
        seniorityLevel: parsed.seniorityLevel,
        industries: parsed.industries,
        tools: parsed.tools,
      });

      res.json(resume);
    } catch (error: any) {
      console.error("Error uploading resume:", error);
      if (error.message === "Only PDF files are allowed") {
        return res.status(400).json({ message: "Only PDF files are accepted" });
      }
      res.status(500).json({ message: "Failed to parse and store resume" });
    }
  });

  app.get("/api/jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getAllJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id, userId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs/evaluate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { rawDescription, jobUrl } = req.body;
      if (!rawDescription || typeof rawDescription !== "string" || rawDescription.trim().length === 0) {
        return res.status(400).json({ message: "Job description is required" });
      }

      const resume = await storage.getResume(userId);
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
        userId,
        title: evaluation.title,
        company: evaluation.company,
        industry: evaluation.industry,
        datePosted: evaluation.datePosted,
        deadline: evaluation.deadline,
        location: evaluation.location,
        visaSponsorship: evaluation.visaSponsorship,
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
        jobUrl: jobUrl || null,
        notes: null,
      });

      res.json(job);
    } catch (error) {
      console.error("Error evaluating job:", error);
      res.status(500).json({ message: "Failed to evaluate job" });
    }
  });

  app.patch("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { status, applied, appliedDate, notes, jobUrl } = req.body;
      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (applied !== undefined) updates.applied = applied;
      if (appliedDate !== undefined) updates.appliedDate = appliedDate;
      if (notes !== undefined) updates.notes = notes;
      if (jobUrl !== undefined) updates.jobUrl = jobUrl;

      const job = await storage.updateJob(id, userId, updates);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteJob(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  return httpServer;
}
