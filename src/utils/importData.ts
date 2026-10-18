import * as XLSX from "xlsx";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { CategoryType, STATUS_OPTIONS, ActivityStatus } from "@/types";
import { getWeekNumber } from "@/utils/categorization";
import { format, parse } from "date-fns";

interface ImportRow {
  Date?: string;
  Week?: number;
  Title?: string;
  Description?: string;
  Category?: string;
  Teams?: string;
  Status?: string;
  "Impact Notes"?: string;
  "Attachment URL"?: string;
  Praises?: string;
}

interface ImportResult {
  success: number;
  errors: string[];
  duplicates: number;
}

export async function importFromExcel(
  file: File,
  uid: string,
  userCategories: string[],
  userTeams: string[]
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
    const jsonData: ImportRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      result.errors.push("No data found in Excel file");
      return result;
    }

    // Fetch existing activities to check for duplicates using Firebase
    const q = query(collection(db, "activities"), where("userId", "==", uid));
    const snapshot = await getDocs(q);

    const existingSet = new Set(
      snapshot.docs.map(doc => {
        const d = doc.data();
        return `${d.title.toLowerCase()}-${d.date}`;
      })
    );

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2;

      try {
        if (!row.Date || !row.Title || !row.Description || !row.Category || !row.Status) {
          result.errors.push(`Row ${rowNum}: Missing required fields`);
          continue;
        }

        // Date Parsing
        let parsedDate: Date;
        if (typeof row.Date === "number") {
          // Excel serial date
          parsedDate = XLSX.SSF.parse_date_code(row.Date) as any;
          parsedDate = new Date((parsedDate as any).y, (parsedDate as any).m - 1, (parsedDate as any).d);
        } else {
          parsedDate = new Date(row.Date);
        }

        if (isNaN(parsedDate.getTime())) {
          result.errors.push(`Row ${rowNum}: Invalid date "${row.Date}"`);
          continue;
        }

        const dateStr = format(parsedDate, "yyyy-MM-dd");

        // Simple validation
        if (!userCategories.includes(row.Category) && row.Category !== "Other") {
          result.errors.push(`Row ${rowNum}: Category "${row.Category}" not found in your profile`);
          continue;
        }

        const duplicateKey = `${row.Title.toLowerCase()}-${dateStr}`;
        if (existingSet.has(duplicateKey)) {
          result.duplicates++;
          continue;
        }

        const teamsArray = row.Teams ? row.Teams.split(",").map(t => t.trim()).filter(Boolean) : [];

        // Insert into Firebase
        await addDoc(collection(db, "activities"), {
          userId: uid,
          date: dateStr,
          weekNumber: row.Week || getWeekNumber(parsedDate),
          title: row.Title,
          description: row.Description,
          category: row.Category,
          teams: teamsArray,
          status: row.Status,
          impactNotes: row["Impact Notes"] || "",
          attachmentUrl: row["Attachment URL"] || null,
          praises: row.Praises || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        existingSet.add(duplicateKey);
        result.success++;
      } catch (err: any) {
        result.errors.push(`Row ${rowNum}: Error - ${err.message}`);
      }
    }

    return result;
  } catch (error: any) {
    result.errors.push(`File error: ${error.message}`);
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
      Category: categories[0] || "Client Success",
      Teams: teams.slice(0, 2).join(", "),
      Status: "Done",
      "Impact Notes": "Resolved 15 pending questions and secured Q3 renewal.",
      "Attachment URL": "",
      Praises: "Client CEO specifically mention the clarity of presentation.",
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Import Format");

  // Update template headers
  XLSX.writeFile(workbook, `pulseboard-import-template.xlsx`);
}
