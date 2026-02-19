import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function parseResume(rawText: string): Promise<{
  skills: string[];
  experience: { title: string; company: string; duration: string; description: string }[];
  seniorityLevel: string;
  industries: string[];
  tools: string[];
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are a resume parser. Extract structured information from the resume text provided.
Return a JSON object with exactly these fields:
- skills: string[] (technical and soft skills)
- experience: array of { title: string, company: string, duration: string, description: string }
- seniorityLevel: string (one of: "Entry Level", "Junior", "Mid-Level", "Senior", "Staff", "Principal", "Director", "VP", "C-Level")
- industries: string[] (industries the candidate has worked in)
- tools: string[] (specific tools, technologies, platforms, frameworks mentioned)

Be thorough but concise. Extract only what is explicitly stated.`,
      },
      {
        role: "user",
        content: rawText,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return {
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    seniorityLevel: parsed.seniorityLevel || "Not determined",
    industries: parsed.industries || [],
    tools: parsed.tools || [],
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
  }
): Promise<{
  title: string;
  company: string;
  industry: string;
  datePosted: string;
  deadline: string;
  keyCapabilities: string[];
  matchingCapabilities: string[];
  fitLevel: string;
  strengths: string[];
  gaps: string[];
  verdict: string;
  recommendation: string;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are a brutally honest hiring manager and recruiter evaluating a job candidate's fit for a position.

You have the candidate's resume data:
Skills: ${resumeData.skills.join(", ")}
Seniority: ${resumeData.seniorityLevel}
Industries: ${resumeData.industries.join(", ")}
Tools: ${resumeData.tools.join(", ")}
Experience: ${JSON.stringify(resumeData.experience)}

Evaluate the job description against this resume. Be direct, evidence-based, and do not sugarcoat.

Return a JSON object with exactly these fields:
- title: string (job title)
- company: string (company name)
- industry: string (industry of the company, or "Not disclosed" if unknown)
- datePosted: string (date posted if mentioned, otherwise "Not disclosed")
- deadline: string (application deadline if mentioned, otherwise "Not disclosed")
- keyCapabilities: string[] (top 5 critical capabilities required)
- matchingCapabilities: string[] (capabilities the candidate actually has from their resume)
- fitLevel: string (exactly one of: "High", "Medium", "Low")
- strengths: string[] (bullet points tied directly to resume evidence)
- gaps: string[] (missing skills, seniority mismatch, industry mismatch, tooling gaps)
- verdict: string (1-2 paragraph hiring manager assessment answering "Would I interview this candidate? Why or why not?")
- recommendation: string (exactly one of: "Apply", "Apply only if referrals/networking exist", "Do not apply (low ROI)")

Do NOT hallucinate dates. If information is not in the job description, mark it as "Not disclosed".
Be specific about strengths and gaps - reference actual skills/experience from the resume.`,
      },
      {
        role: "user",
        content: jobDescription,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return {
    title: parsed.title || "Unknown Position",
    company: parsed.company || "Unknown Company",
    industry: parsed.industry || "Not disclosed",
    datePosted: parsed.datePosted || "Not disclosed",
    deadline: parsed.deadline || "Not disclosed",
    keyCapabilities: parsed.keyCapabilities || [],
    matchingCapabilities: parsed.matchingCapabilities || [],
    fitLevel: parsed.fitLevel || "Medium",
    strengths: parsed.strengths || [],
    gaps: parsed.gaps || [],
    verdict: parsed.verdict || "",
    recommendation: parsed.recommendation || "Apply",
  };
}
