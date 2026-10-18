import * as XLSX from "xlsx";
import { Activity } from "@/types";
import { format, parseISO } from "date-fns";

export function exportToExcel(activities: Activity[], filename: string = "work-activities") {
  // Prepare data for Excel
  const excelData = activities.map((activity) => ({
    Date: format(parseISO(activity.date), "MMM d, yyyy"),
    Week: activity.weekNumber,
    Title: activity.title,
    Description: activity.description,
    Category: activity.category,
    Teams: activity.teams.join(", "),
    Status: activity.status,
    "Impact Notes": activity.impactNotes,
    "Attachment URL": activity.attachmentUrl || "",
    Praises: activity.praises || "",
    "Created At": format(new Date(activity.createdAt), "MMM d, yyyy HH:mm"),
    "Last Updated": format(new Date(activity.updatedAt), "MMM d, yyyy HH:mm"),
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // Date
    { wch: 6 },  // Week
    { wch: 40 }, // Title
    { wch: 50 }, // Description
    { wch: 30 }, // Category
    { wch: 30 }, // Teams
    { wch: 15 }, // Status
    { wch: 50 }, // Impact Notes
    { wch: 40 }, // Attachment URL
    { wch: 50 }, // Praises
    { wch: 18 }, // Created At
    { wch: 18 }, // Last Updated
  ];
  worksheet["!cols"] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Activities");

  // Generate Excel file and trigger download
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmm");
  XLSX.writeFile(workbook, `${filename}-${timestamp}.xlsx`);
}
