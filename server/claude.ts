import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractJson(text: string): string {
  // Strip markdown code blocks if Claude wraps the response
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

export async function parseResume(rawText: string): Promise<{
  skills: string[];
  experience: { title: string; company: string; duration: string; description: string }[];
  seniorityLevel: string;
  industries: string[];
  tools: string[];
  education: { degree: string; field: string; institution: string; graduationYear: string; inProgress: boolean }[];
}> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `You are a resume parser. Extract structured information from the resume text provided.
Return a JSON object with exactly these fields:
- skills: string[] (technical and soft skills)
- experience: array of { title: string, company: string, duration: string, description: string }
- seniorityLevel: string (one of: "Entry Level", "Junior", "Mid-Level", "Senior", "Staff", "Principal", "Director", "VP", "C-Level")
- industries: string[] (industries the candidate has worked in)
- tools: string[] (specific tools, technologies, platforms, frameworks mentioned)
- education: array of { degree: string, field: string, institution: string, graduationYear: string, inProgress: boolean }
  - degree: e.g. "Bachelor of Science", "Master of Business Administration", "PhD"
  - field: e.g. "Computer Science", "Business Administration"
  - institution: university or school name
  - graduationYear: e.g. "2020" or "2025 (expected)" — if currently enrolled and graduating soon, note it
  - inProgress: true if the candidate is currently enrolled and has not yet graduated

Be thorough but concise. Extract only what is explicitly stated.
Return ONLY valid JSON, no markdown, no explanation.`,
    messages: [{ role: "user", content: rawText }],
  });

  const content = response.content[0].type === "text" ? extractJson(response.content[0].text) : "{}";
  const parsed = JSON.parse(content);
  return {
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    seniorityLevel: parsed.seniorityLevel || "Not determined",
    industries: parsed.industries || [],
    tools: parsed.tools || [],
    education: parsed.education || [],
  };
}

export async function evaluateJob(
  jobDescription: string,
  resumeData: {
    skills: string[];
    experience: any[];
    seniorityLevel: string;
    industries: string[];
    tools: string[];
    education: any[];
  }
): Promise<{
  title: string;
  company: string;
  industry: string;
  datePosted: string;
  deadline: string;
  location: string;
  visaSponsorship: string;
  keyCapabilities: string[];
  matchingCapabilities: string[];
  fitLevel: string;
  strengths: string[];
  gaps: string[];
  verdict: string;
  recommendation: string;
}> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `You are a brutally honest hiring manager and recruiter evaluating a job candidate's fit for a position.

You have the candidate's resume data:
Skills: ${resumeData.skills.join(", ")}
Seniority: ${resumeData.seniorityLevel}
Industries: ${resumeData.industries.join(", ")}
Tools: ${resumeData.tools.join(", ")}
Experience: ${JSON.stringify(resumeData.experience)}
Education: ${JSON.stringify(resumeData.education)}

Evaluate the job description against this resume. Be direct, evidence-based, and do not sugarcoat.

Return a JSON object with exactly these fields:
- title: string (job title)
- company: string (company name)
- industry: string (industry of the company, or "Not disclosed" if unknown)
- datePosted: string (date posted if mentioned, otherwise "Not disclosed")
- deadline: string (application deadline if mentioned, otherwise "Not disclosed")
- location: string (job location including city/state/country and remote/hybrid/onsite if mentioned, otherwise "Not disclosed")
- visaSponsorship: string (one of the following based on what the job posting states about work authorization: "Visa sponsorship available" if they explicitly offer sponsorship, "CPT/OPT accepted" if they mention accepting CPT or OPT, "CPT/OPT/STEM OPT accepted" if they mention STEM OPT or OPT extension, "US work authorization required (no sponsorship)" if they require existing authorization and won't sponsor, "Not disclosed" if nothing is mentioned about visa/work authorization. If multiple apply, combine them like "Visa sponsorship available, CPT/OPT/STEM OPT accepted". Be precise - only state what the posting explicitly says.)
- keyCapabilities: string[] (top 5 critical capabilities required)
- matchingCapabilities: string[] (capabilities the candidate actually has from their resume)
- fitLevel: string (exactly one of: "High", "Medium", "Low")
- strengths: string[] (bullet points tied directly to resume evidence)
- gaps: string[] (missing skills, seniority mismatch, industry mismatch, tooling gaps)
- verdict: string (1-2 paragraph hiring manager assessment. MUST begin with exactly one of these opening sentences based on your assessment: "I would interview this candidate." / "I would not interview this candidate." / "I would consider interviewing this candidate only conditionally." — then follow with your reasoning.)
- recommendation: string (exactly one of: "Apply", "Apply only if referrals/networking exist", "Do not apply (low ROI)")

Do NOT hallucinate dates or visa information. If information is not in the job description, mark it as "Not disclosed".
Be specific about strengths and gaps - reference actual skills/experience from the resume.
Return ONLY valid JSON, no markdown, no explanation.`,
    messages: [{ role: "user", content: jobDescription }],
  });

  const content = response.content[0].type === "text" ? extractJson(response.content[0].text) : "{}";
  const parsed = JSON.parse(content);
  return {
    title: parsed.title || "Unknown Position",
    company: parsed.company || "Unknown Company",
    industry: parsed.industry || "Not disclosed",
    datePosted: parsed.datePosted || "Not disclosed",
    deadline: parsed.deadline || "Not disclosed",
    location: parsed.location || "Not disclosed",
    visaSponsorship: parsed.visaSponsorship || "Not disclosed",
    keyCapabilities: parsed.keyCapabilities || [],
    matchingCapabilities: parsed.matchingCapabilities || [],
    fitLevel: parsed.fitLevel || "Medium",
    strengths: parsed.strengths || [],
    gaps: parsed.gaps || [],
    verdict: parsed.verdict || "",
    recommendation: parsed.recommendation || "Apply",
  };
}
