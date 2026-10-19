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

// Risk Level
export type RiskLevel = 'low' | 'medium' | 'high';

// Category names are user-defined (users can add, rename and delete them),
// so any string is valid. Defaults live in src/lib/categories.ts.
export type ActivityCategory = string;

// Job function chosen at onboarding; tunes category keyword suggestions.
export type JobFunction = 'engineering' | 'product' | 'sales_cs' | 'marketing' | 'operations' | 'general';

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
  jobFunction?: JobFunction;
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

// Default categories, job functions and team options live in src/lib/categories.ts.

export const STATUS_OPTIONS: ActivityStatus[] = ["Not Started", "In Progress", "Done", "Blocked"];

export const GOAL_STATUS_OPTIONS: GoalStatus[] = ['on_track', 'at_risk', 'completed', 'behind'];

export const GOAL_PRIORITY_OPTIONS: GoalPriority[] = ['low', 'medium', 'high', 'critical'];
