// User Roles
export type UserRole = 'employee' | 'manager' | 'admin';

// Activity Status
export type ActivityStatus = "Not Started" | "In Progress" | "Done" | "Blocked";

// Goal Status
export type GoalStatus = 'on_track' | 'at_risk' | 'completed' | 'behind';

// Goal Priority
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

// Action Item Status
export type ActionItemStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

// Change Type for changelog
export type ChangeType = 'feature' | 'improvement' | 'bugfix' | 'breaking';

// Risk Level
export type RiskLevel = 'low' | 'medium' | 'high';

// Activity Categories (extended)
export type ActivityCategory =
  | "Delivery"
  | "Support"
  | "Meetings"
  | "Documentation"
  | "Learning"
  | "Roofing Core Vertical"
  | "Product & Features"
  | "Partnerships & Expansion"
  | "Knowledge & Enablement"
  | "Cross-functional Collaboration"
  | "Other";

// User Profile (enhanced)
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  team?: string;
  managerId?: string;
  managerName?: string;
  createdAt: string;
  updatedAt: string;
}

// Activity
export interface Activity {
  id: string;
  userId: string;
  date: string;
  weekNumber: number;
  quarter?: string;
  title: string;
  description: string;
  category: ActivityCategory;
  teams: string[];
  impactNotes: string;
  status: ActivityStatus;
  attachmentUrl?: string;
  praises?: string;
  createdAt: string;
  updatedAt: string;
}

// Weekly Check-In
export interface CheckIn {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  workSummary: string;
  achievements?: string;
  blockers?: string;
  supportNeeded?: string;
  linkedGoalIds: string[];
  categories: ActivityCategory[];
  createdAt: string;
  updatedAt: string;
}

// Goal
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: GoalPriority;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  progress: number; // 0-100
  linkedCheckInIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Feedback from Manager
export interface Feedback {
  id: string;
  checkInId?: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  content: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
}

// Action Item
export interface ActionItem {
  id: string;
  feedbackId?: string;
  employeeId: string;
  assignedById: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: ActionItemStatus;
  completedAt?: string;
  createdAt: string;
}

// AI Performance Summary
export interface PerformanceSummary {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId?: string;
  periodStart: string;
  periodEnd: string;
  contributions: string;
  strengths: string;
  improvements: string;
  risks: string;
  createdAt: string;
  updatedAt: string;
}

// Change Log Entry
export interface ChangeLog {
  id: string;
  version: string;
  releaseDate: string;
  changeType: ChangeType;
  title: string;
  description: string;
  createdAt: string;
}

// Audit Log Entry
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

// Alert/Reminder
export interface Alert {
  id: string;
  userId: string;
  type: 'check_in_due' | 'action_item_due' | 'goal_deadline' | 'feedback_pending' | 'workload_risk';
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  riskLevel?: RiskLevel;
  dueDate?: string;
  dismissed: boolean;
  createdAt: string;
}

// User Category (custom categories)
export interface UserCategory {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
  keywords: string[];
  createdAt: string;
}

// User Team
export interface UserTeam {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

// Team Member (for manager views)
export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  team?: string;
  lastCheckIn?: CheckIn;
  pendingActionItems: number;
  goalsAtRisk: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalCheckIns: number;
  completedGoals: number;
  activeGoals: number;
  goalsAtRisk: number;
  pendingActionItems: number;
  averageCheckInCompletion: number;
}

// Category Info (for display)
export interface CategoryInfo {
  name: ActivityCategory;
  emoji: string;
  color: string;
  keywords: string[];
}

// Default categories
export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  {
    name: "Delivery",
    emoji: "🚀",
    color: "hsl(145 65% 50%)",
    keywords: ["ship", "deploy", "release", "launch", "complete"],
  },
  {
    name: "Support",
    emoji: "🛟",
    color: "hsl(210 80% 58%)",
    keywords: ["help", "support", "assist", "fix", "resolve"],
  },
  {
    name: "Meetings",
    emoji: "📅",
    color: "hsl(35 85% 55%)",
    keywords: ["meeting", "call", "sync", "standup", "review"],
  },
  {
    name: "Documentation",
    emoji: "📝",
    color: "hsl(265 75% 60%)",
    keywords: ["doc", "write", "document", "guide", "readme"],
  },
  {
    name: "Learning",
    emoji: "📚",
    color: "hsl(340 75% 60%)",
    keywords: ["learn", "study", "course", "training", "research"],
  },
  {
    name: "Roofing Core Vertical",
    emoji: "🧩",
    color: "hsl(265 75% 60%)",
    keywords: ["golden account", "roofing demo", "vertical", "roofing account", "demo environment", "roofing"],
  },
  {
    name: "Product & Features",
    emoji: "⚙️",
    color: "hsl(210 80% 58%)",
    keywords: ["checklist", "builder", "feature", "beta", "product", "QA", "testing", "development", "bug", "release"],
  },
  {
    name: "Partnerships & Expansion",
    emoji: "📈",
    color: "hsl(35 85% 55%)",
    keywords: ["partner", "TSSG", "expansion", "widget", "integration", "external", "partnership"],
  },
  {
    name: "Knowledge & Enablement",
    emoji: "🧠",
    color: "hsl(145 60% 50%)",
    keywords: ["training", "documentation", "enablement", "knowledge", "onboarding", "teach", "guide", "learn"],
  },
  {
    name: "Cross-functional Collaboration",
    emoji: "🤝",
    color: "hsl(340 75% 60%)",
    keywords: ["meeting", "alignment", "sync", "collaborate", "workshop", "discussion", "planning"],
  },
  {
    name: "Other",
    emoji: "🔹",
    color: "hsl(220 15% 60%)",
    keywords: [],
  },
];

export const TEAM_OPTIONS = [
  "Sales",
  "CX",
  "Marketing",
  "RevOps",
  "Product",
  "Implementation",
  "Engineering",
  "Design",
];

export const STATUS_OPTIONS: ActivityStatus[] = ["Not Started", "In Progress", "Done", "Blocked"];

export const GOAL_STATUS_OPTIONS: GoalStatus[] = ['on_track', 'at_risk', 'completed', 'behind'];

export const GOAL_PRIORITY_OPTIONS: GoalPriority[] = ['low', 'medium', 'high', 'critical'];

// Alias so files can import { CATEGORIES } from "@/types"
export const CATEGORIES = DEFAULT_CATEGORIES;

// Alias for backwards compatibility
export type CategoryType = ActivityCategory;

// ActivityCategory string array for select dropdowns
export const ACTIVITY_CATEGORY_OPTIONS: ActivityCategory[] = [
  "Delivery",
  "Support",
  "Meetings",
  "Documentation",
  "Learning",
  "Roofing Core Vertical",
  "Product & Features",
  "Partnerships & Expansion",
  "Knowledge & Enablement",
  "Cross-functional Collaboration",
  "Other",
];

