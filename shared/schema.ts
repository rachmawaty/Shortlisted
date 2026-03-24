import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  rawText: text("raw_text").notNull(),
  skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
  experience: json("experience").$type<{ title: string; company: string; duration: string; description: string }[]>().notNull().default(sql`'[]'::json`),
  seniorityLevel: text("seniority_level").notNull().default(""),
  industries: text("industries").array().notNull().default(sql`'{}'::text[]`),
  tools: text("tools").array().notNull().default(sql`'{}'::text[]`),
  education: json("education").$type<{ degree: string; field: string; institution: string; graduationYear: string; inProgress: boolean }[]>().notNull().default(sql`'[]'::json`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  industry: text("industry").notNull().default("Not disclosed"),
  datePosted: text("date_posted").notNull().default("Not disclosed"),
  deadline: text("deadline").notNull().default("Not disclosed"),
  keyCapabilities: text("key_capabilities").array().notNull().default(sql`'{}'::text[]`),
  matchingCapabilities: text("matching_capabilities").array().notNull().default(sql`'{}'::text[]`),
  fitLevel: text("fit_level").notNull().default("Medium"),
  strengths: text("strengths").array().notNull().default(sql`'{}'::text[]`),
  gaps: text("gaps").array().notNull().default(sql`'{}'::text[]`),
  verdict: text("verdict").notNull().default(""),
  recommendation: text("recommendation").notNull().default("Apply"),
  applied: boolean("applied").notNull().default(false),
  appliedDate: text("applied_date"),
  interviewDate: text("interview_date"),
  offerDate: text("offer_date"),
  rejectedDate: text("rejected_date"),
  status: text("status").notNull().default("Not Applied"),
  location: text("location").notNull().default("Not disclosed"),
  visaSponsorship: text("visa_sponsorship").notNull().default("Not disclosed"),
  rawDescription: text("raw_description").notNull(),
  jobUrl: text("job_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
