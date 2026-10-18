import { format } from "date-fns";

export interface UserData {
  id: string;
  email: string;
  fullName?: string | null;
  full_name?: string | null;
  role?: string;
  team?: string;
  createdAt?: string;
  created_at?: string;
  activityCount?: number;
  activity_count?: number;
}

export function exportUserListToCSV(users: UserData[]) {
  // Prepare CSV data
  const headers = ["Email", "Full Name", "Role", "Team", "Signup Date", "Activity Count"];
  const rows = users.map((user) => [
    user.email,
    user.fullName || user.full_name || "",
    user.role || "employee",
    user.team || "",
    format(new Date(user.createdAt || user.created_at || new Date()), "MMM d, yyyy"),
    (user.activityCount ?? user.activity_count ?? 0).toString(),
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmm");
  link.setAttribute("href", url);
  link.setAttribute("download", `user-list-${timestamp}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
