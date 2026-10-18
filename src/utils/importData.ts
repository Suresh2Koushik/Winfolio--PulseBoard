import * as XLSX from "xlsx";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { STATUS_OPTIONS } from "@/types";
import { getWeekNumber, getQuarter } from "@/utils/categorization";
import { format, isValid, parseISO } from "date-fns";

type Cell = string | number | boolean | null | undefined;

interface ImportRow {
  Date?: Cell;
  Week?: Cell;
  Title?: Cell;
  Description?: Cell;
  Category?: Cell;
  Teams?: Cell;
  Status?: Cell;
  "Impact Notes"?: Cell;
  "Attachment URL"?: Cell;
  Praises?: Cell;
}

interface ImportResult {
  success: number;
  errors: string[];
  duplicates: number;
}

const MAX_ROWS = 1000;
const BATCH_SIZE = 400;

const text = (value: Cell, max: number) =>
  value === null || value === undefined ? "" : String(value).trim().slice(0, max);

function parseDateCell(value: Cell): Date | null {
  if (typeof value === "number") {
    // Excel serial date
    const parts = XLSX.SSF.parse_date_code(value);
    return parts ? new Date(parts.y, parts.m - 1, parts.d) : null;
  }
  const raw = text(value, 50);
  if (!raw) return null;
  // yyyy-MM-dd is read as a local date; anything else falls back to the browser parser.
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? parseISO(raw) : new Date(raw);
  return isValid(parsed) ? parsed : null;
}

function safeLink(value: Cell): string | null {
  const raw = text(value, 2048);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function importFromExcel(
  file: File,
  uid: string,
  userCategories: string[],
  _userTeams: string[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    errors: [],
    duplicates: 0,
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: ImportRow[] = worksheet ? XLSX.utils.sheet_to_json(worksheet) : [];

    if (jsonData.length === 0) {
      result.errors.push("No data found in Excel file");
      return result;
    }
    if (jsonData.length > MAX_ROWS) {
      result.errors.push(`This file has ${jsonData.length} rows. Please import at most ${MAX_ROWS} rows at a time.`);
      return result;
    }

    // Existing activities, to skip duplicates (same title on the same date).
    const snapshot = await getDocs(query(collection(db, "activities"), where("userId", "==", uid)));
    const existingSet = new Set(
      snapshot.docs.map((d) => `${String(d.data().title ?? "").toLowerCase()}-${d.data().date}`)
    );

    const categoryByLower = new Map(
      [...userCategories, "Other"].map((name) => [name.toLowerCase(), name])
    );
    const statusByLower = new Map(STATUS_OPTIONS.map((s) => [s.toLowerCase(), s]));

    const rows: Record<string, unknown>[] = [];

    jsonData.forEach((row, i) => {
      const rowNum = i + 2;
      const title = text(row.Title, 200);
      const categoryInput = text(row.Category, 100);
      const statusInput = text(row.Status, 50);

      if (!row.Date || !title || !categoryInput || !statusInput) {
        result.errors.push(`Row ${rowNum}: Missing required fields (Date, Title, Category, Status)`);
        return;
      }

      const parsedDate = parseDateCell(row.Date);
      if (!parsedDate) {
        result.errors.push(`Row ${rowNum}: Invalid date "${text(row.Date, 50)}"`);
        return;
      }

      const category = categoryByLower.get(categoryInput.toLowerCase());
      if (!category) {
        result.errors.push(`Row ${rowNum}: Category "${categoryInput}" not found in your categories`);
        return;
      }

      const status = statusByLower.get(statusInput.toLowerCase());
      if (!status) {
        result.errors.push(`Row ${rowNum}: Status must be one of ${STATUS_OPTIONS.join(", ")}`);
        return;
      }

      const dateStr = format(parsedDate, "yyyy-MM-dd");
      const duplicateKey = `${title.toLowerCase()}-${dateStr}`;
      if (existingSet.has(duplicateKey)) {
        result.duplicates++;
        return;
      }
      existingSet.add(duplicateKey);

      const attachmentInput = text(row["Attachment URL"], 2048);
      const attachmentUrl = safeLink(attachmentInput);
      if (attachmentInput && !attachmentUrl) {
        result.errors.push(`Row ${rowNum}: Attachment URL ignored (must start with http:// or https://)`);
      }

      rows.push({
        userId: uid,
        date: dateStr,
        // Always derived from the date so it matches the rest of the app.
        weekNumber: getWeekNumber(parsedDate),
        quarter: getQuarter(parsedDate),
        title,
        description: text(row.Description, 5000),
        category,
        teams: text(row.Teams, 2000).split(",").map((t) => t.trim().slice(0, 100)).filter(Boolean).slice(0, 50),
        status,
        impactNotes: text(row["Impact Notes"], 5000),
        attachmentUrl,
        praises: text(row.Praises, 2000) || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    // Write in batches; a failed batch is reported without losing the others.
    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      const chunk = rows.slice(start, start + BATCH_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((data) => batch.set(doc(collection(db, "activities")), data));
      try {
        await batch.commit();
        result.success += chunk.length;
      } catch (error) {
        console.error("Import batch failed:", error);
        result.errors.push(`Could not save ${chunk.length} rows. Please check the values and try again.`);
      }
    }

    return result;
  } catch (error) {
    console.error("Import failed:", error);
    result.errors.push("Could not read this file. Make sure it is an .xlsx file based on the template.");
    return result;
  }
}


export function generateExcelTemplate(
  categories: string[],
  teams: string[]
): void {
  const sampleData = [
    {
      Date: format(new Date(), "yyyy-MM-dd"),
      Week: getWeekNumber(new Date()),
      Title: "Customer Success Workshop",
      Description: "Led a 2-hour session for the new enterprise client onboarding.",
      Category: categories[0] || "Other",
      Teams: teams.slice(0, 2).join(", "),
      Status: "Done",
      "Impact Notes": "Resolved 15 pending questions and secured Q3 renewal.",
      "Attachment URL": "",
      Praises: "Client CEO specifically mentioned the clarity of presentation.",
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Import Format");

  // Update template headers
  XLSX.writeFile(workbook, `pulseboard-import-template.xlsx`);
}
