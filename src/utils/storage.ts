import { Activity } from "@/types";

const STORAGE_KEY = "work-tracker-activities";

export function saveActivities(activities: Activity[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

export function loadActivities(): Activity[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function addActivity(activity: Activity): Activity[] {
  const activities = loadActivities();
  activities.unshift(activity);
  saveActivities(activities);
  return activities;
}

export function updateActivity(id: string, updates: Partial<Activity>): Activity[] {
  const activities = loadActivities();
  const index = activities.findIndex((a) => a.id === id);
  if (index !== -1) {
    activities[index] = { ...activities[index], ...updates, updatedAt: new Date().toISOString() };
    saveActivities(activities);
  }
  return activities;
}

export function deleteActivity(id: string): Activity[] {
  const activities = loadActivities();
  const filtered = activities.filter((a) => a.id !== id);
  saveActivities(filtered);
  return filtered;
}
