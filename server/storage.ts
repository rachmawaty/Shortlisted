import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { resumes, jobs, type Resume, type InsertResume, type Job, type InsertJob } from "@shared/schema";

export interface IStorage {
  getResume(): Promise<Resume | null>;
  upsertResume(data: InsertResume): Promise<Resume>;
  getAllJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(data: InsertJob): Promise<Job>;
  updateJob(id: number, data: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getResume(): Promise<Resume | null> {
    const rows = await db.select().from(resumes).orderBy(desc(resumes.createdAt)).limit(1);
    return rows[0] || null;
  }

  async upsertResume(data: InsertResume): Promise<Resume> {
    await db.delete(resumes);
    const [resume] = await db.insert(resumes).values(data).returning();
    return resume;
  }

  async getAllJobs(): Promise<Job[]> {
    return db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createJob(data: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(data).returning();
    return job;
  }

  async updateJob(id: number, data: Partial<InsertJob>): Promise<Job | undefined> {
    const [job] = await db.update(jobs).set(data).where(eq(jobs.id, id)).returning();
    return job;
  }

  async deleteJob(id: number): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }
}

export const storage = new DatabaseStorage();
