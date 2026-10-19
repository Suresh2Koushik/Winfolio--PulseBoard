import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileSpreadsheet, Upload, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useActivities } from "@/hooks/useActivities";
import { useUserData } from "@/hooks/useUserData";
import { exportToExcel } from "@/utils/exportData";
import { generateExcelTemplate } from "@/utils/importData";
import { CategoryManagement } from "@/components/CategoryManagement";
import { UploadModal } from "@/components/UploadModal";
import { Page, PageHeader } from "@/components/app/ui";
import { JOB_FUNCTIONS } from "@/lib/categories";

function Section({ id, title, body, children }: { id: string; title: string; body?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4 rounded-2xl border bg-card p-5 md:p-6">
      <div className="space-y-1">
        <h2 id={id} className="text-lg font-extrabold">{title}</h2>
        {body && <p className="text-sm text-muted-foreground">{body}</p>}
      </div>
      {children}
    </section>
  );
}

export default function Settings() {
  const { user, userProfile } = useAuth();
  const { activities } = useActivities();
  const { categories, teams } = useUserData();
  const [uploadOpen, setUploadOpen] = useState(false);
  const jobFunction = JOB_FUNCTIONS.find((j) => j.id === userProfile?.jobFunction)?.label;

  const rows: [string, string | undefined][] = [
    ["Name", userProfile?.fullName],
    ["Email", user?.email ?? undefined],
    ["Team", userProfile?.team],
    ["Kind of work", jobFunction],
  ];

  return (
    <Page className="max-w-4xl">
      <PageHeader title="Settings" subtitle="Your profile, categories and data." />

      <Section id="profile-heading" title="Profile">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-semibold">{value || "—"}</dd>
            </div>
          ))}
        </dl>
        <Link to="/onboard" className="inline-flex min-h-[40px] items-center gap-2 rounded-full border-2 border-foreground px-4 text-sm font-bold hover:bg-muted">
          <UserCog className="h-4 w-4" aria-hidden="true" /> Edit profile
        </Link>
      </Section>

      <section aria-label="Categories" className="rounded-2xl border bg-card p-5 md:p-6">
        <CategoryManagement />
      </section>

      <Section id="data-heading" title="Your data" body="Your journal belongs to you. Download it any time, or bring wins in from a spreadsheet.">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={activities.length === 0}
            onClick={() => { exportToExcel(activities, "winfolio-wins"); toast.success("Your wins were downloaded"); }}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" /> Export wins
          </button>
          <button type="button" onClick={() => setUploadOpen(true)} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-semibold hover:bg-muted">
            <Upload className="h-4 w-4" aria-hidden="true" /> Import wins
          </button>
          <button
            type="button"
            onClick={() => { generateExcelTemplate(categories.map((c) => c.name), teams); toast.success("Template downloaded"); }}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-semibold hover:bg-muted"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Import template
          </button>
        </div>
      </Section>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} onImportComplete={() => toast.success("Wins imported")} />
    </Page>
  );
}
