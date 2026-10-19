import type { CategoryInfo, JobFunction } from "@/types";

/**
 * Recommended categories. They mirror the sections most performance-review forms
 * use, so a generated report reads like a review rather than a task list.
 * Keywords drive the "Suggested category" hint in the activity form; role-specific
 * keywords are added on top for the user's job function.
 */
export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  {
    name: "Delivery & Execution",
    emoji: "🚀",
    color: "hsl(145 63% 42%)",
    keywords: ["shipped", "launched", "delivered", "released", "milestone", "deadline", "rollout", "go-live", "launch"],
  },
  {
    name: "Customer & Business Impact",
    emoji: "🎯",
    color: "hsl(24 90% 55%)",
    keywords: ["customer", "client", "revenue", "retention", "renewal", "nps", "csat", "growth", "conversion", "saved"],
  },
  {
    name: "Problem Solving",
    emoji: "🛠️",
    color: "hsl(4 75% 56%)",
    keywords: ["fixed", "resolved", "issue", "bug", "incident", "escalation", "root cause", "troubleshoot", "blocker", "outage"],
  },
  {
    name: "Process Improvement",
    emoji: "💡",
    color: "hsl(45 93% 47%)",
    keywords: ["automated", "automation", "improved", "streamlined", "optimized", "efficiency", "workflow", "template", "reduced"],
  },
  {
    name: "Collaboration",
    emoji: "🤝",
    color: "hsl(199 89% 48%)",
    keywords: ["partnered", "cross-functional", "alignment", "stakeholder", "workshop", "coordinated", "sync", "partnership"],
  },
  {
    name: "Leadership & Mentoring",
    emoji: "🧭",
    color: "hsl(262 70% 58%)",
    keywords: ["mentored", "coached", "led", "hiring", "interviewed", "onboarded", "delegated", "initiative", "1:1"],
  },
  {
    name: "Learning & Growth",
    emoji: "📚",
    color: "hsl(330 75% 58%)",
    keywords: ["learned", "course", "certification", "training", "conference", "upskill", "studied", "workshop attended"],
  },
  {
    name: "Knowledge Sharing",
    emoji: "📝",
    color: "hsl(173 70% 38%)",
    keywords: ["documented", "documentation", "guide", "wiki", "presented", "demo", "talk", "playbook", "knowledge base"],
  },
  {
    name: "Culture & Community",
    emoji: "🌱",
    color: "hsl(95 55% 42%)",
    keywords: ["culture", "team event", "offsite", "volunteer", "community", "recruiting event", "employee resource group", "celebration"],
  },
  {
    name: "Other",
    emoji: "🔹",
    color: "hsl(220 15% 60%)",
    keywords: [],
  },
];

export const JOB_FUNCTIONS: { id: JobFunction; label: string }[] = [
  { id: "engineering", label: "Engineering" },
  { id: "product", label: "Product & Design" },
  { id: "sales_cs", label: "Sales & Customer Success" },
  { id: "marketing", label: "Marketing" },
  { id: "operations", label: "Operations, Finance & People" },
  { id: "general", label: "Other / General" },
];

// Extra keywords per job function, keyed by category name.
const ROLE_KEYWORDS: Record<JobFunction, Record<string, string[]>> = {
  engineering: {
    "Delivery & Execution": ["deployed", "merged", "feature", "api", "migration", "refactor"],
    "Problem Solving": ["debugged", "hotfix", "on-call", "latency", "regression", "postmortem"],
    "Process Improvement": ["ci", "pipeline", "test coverage", "tooling", "performance"],
    "Knowledge Sharing": ["design doc", "rfc", "code review", "readme", "tech talk"],
  },
  product: {
    "Delivery & Execution": ["prd", "roadmap", "spec", "prototype", "beta", "feature launch"],
    "Customer & Business Impact": ["user research", "adoption", "activation", "experiment", "a/b test"],
    "Collaboration": ["design review", "sprint planning", "kickoff", "stakeholder review"],
    "Knowledge Sharing": ["release notes", "changelog", "product demo"],
  },
  sales_cs: {
    "Customer & Business Impact": ["closed", "deal", "upsell", "expansion", "pipeline", "quota", "churn", "qbr"],
    "Delivery & Execution": ["onboarding", "implementation", "go-live", "handoff"],
    "Problem Solving": ["support ticket", "escalated", "complaint", "sla"],
    "Collaboration": ["partner", "account plan", "executive sponsor"],
  },
  marketing: {
    "Delivery & Execution": ["campaign", "launch", "content", "webinar", "event", "newsletter"],
    "Customer & Business Impact": ["leads", "mql", "traffic", "seo", "engagement", "signups", "roi"],
    "Knowledge Sharing": ["blog", "case study", "whitepaper", "messaging"],
    "Collaboration": ["agency", "co-marketing", "brand"],
  },
  operations: {
    "Process Improvement": ["policy", "compliance", "audit", "vendor", "procurement", "cost savings"],
    "Delivery & Execution": ["payroll", "close", "budget", "forecast", "report"],
    "Leadership & Mentoring": ["performance review", "hiring plan", "headcount"],
    "Culture & Community": ["engagement survey", "benefits", "wellbeing"],
  },
  general: {},
};

/** The recommended categories with keywords tuned for a job function. */
export function categoriesForRole(role: JobFunction | undefined): CategoryInfo[] {
  const extra = ROLE_KEYWORDS[role ?? "general"] ?? {};
  return DEFAULT_CATEGORIES.map((category) => ({
    ...category,
    keywords: Array.from(new Set([...category.keywords, ...(extra[category.name] ?? [])])),
  }));
}

/**
 * Display info for category names from earlier versions, so existing activities
 * keep their icon and colour even if the user hasn't kept that category.
 */
const LEGACY_DISPLAY: Record<string, { emoji: string; color: string }> = {
  "Delivery": { emoji: "🚀", color: "hsl(145 65% 50%)" },
  "Support": { emoji: "🛟", color: "hsl(210 80% 58%)" },
  "Meetings": { emoji: "📅", color: "hsl(35 85% 55%)" },
  "Documentation": { emoji: "📝", color: "hsl(265 75% 60%)" },
  "Learning": { emoji: "📚", color: "hsl(340 75% 60%)" },
  "Roofing Core Vertical": { emoji: "🧩", color: "hsl(265 75% 60%)" },
  "Product & Features": { emoji: "⚙️", color: "hsl(210 80% 58%)" },
  "Partnerships & Expansion": { emoji: "📈", color: "hsl(35 85% 55%)" },
  "Knowledge & Enablement": { emoji: "🧠", color: "hsl(145 60% 50%)" },
  "Cross-functional Collaboration": { emoji: "🤝", color: "hsl(340 75% 60%)" },
};

const FALLBACK_DISPLAY = { emoji: "🔹", color: "hsl(220 15% 60%)" };

/** Emoji and colour for a category name: the user's own definition first, then defaults. */
export function categoryDisplay(
  name: string,
  userCategories: { name: string; emoji: string; color: string }[] = [],
): { emoji: string; color: string } {
  return (
    userCategories.find((c) => c.name === name)
    ?? DEFAULT_CATEGORIES.find((c) => c.name === name)
    ?? LEGACY_DISPLAY[name]
    ?? FALLBACK_DISPLAY
  );
}

export const TEAM_OPTIONS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Customer Success",
  "Marketing",
  "Operations",
  "Finance",
  "People",
  "Leadership",
];
