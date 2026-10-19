import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import {
    CheckIn,
    Goal,
    Activity,
    PerformanceSummary,
    UserProfile
} from '@/types';
import type { ReviewData } from '@/lib/review';

// jspdf-autotable records where the last table ended
declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable: { finalY: number };
    }
}

export const exportPerformanceReport = (
    user: UserProfile,
    summary: PerformanceSummary,
    checkIns: CheckIn[],
    goals: Goal[]
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const dateStr = format(new Date(), 'MMM d, yyyy');

    // Header
    doc.setFillColor(31, 41, 55); // Dark slate
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Performance Intelligence Report', 20, 25);

    doc.setFontSize(10);
    doc.text(`Generated on ${dateStr}`, pageWidth - 20, 25, { align: 'right' });

    // User Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(user.fullName, 20, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Team: ${user.team || 'N/A'}`, 20, 62);
    doc.text(`Period: ${format(new Date(summary.periodStart), 'MMM d')} - ${format(new Date(summary.periodEnd), 'MMM d, yyyy')}`, 20, 67);

    // AI Summary Sections
    let currentY = 80;

    const addSection = (title: string, content: string, color: [number, number, number]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(title, 20, currentY);

        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Split text to fit page width
        const splitText = doc.splitTextToSize(content, pageWidth - 40);
        doc.text(splitText, 20, currentY + 7);

        currentY += 15 + (splitText.length * 5);
    };

    addSection('Key Contributions', summary.contributions, [16, 185, 129]); // Success green
    addSection('Strengths', summary.strengths, [79, 70, 229]); // Primary Indigo
    addSection('Areas for Improvement', summary.improvements, [37, 99, 235]); // Info Blue
    addSection('Notable Risks', summary.risks, [220, 38, 38]); // Destructive Red

    // Recent Check-ins Table
    if (checkIns.length > 0) {
        if (currentY > 220) {
            doc.addPage();
            currentY = 20;
        } else {
            currentY += 10;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Recent Weekly Check-Ins', 20, currentY);

        const tableData = checkIns.map(c => [
            `${format(parseISO(c.weekStart), 'MMM d')} - ${format(parseISO(c.weekEnd), 'MMM d')}`,
            c.workSummary,
            c.achievements || '-',
            c.blockers ? 'Has Blockers' : 'Completed'
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Week', 'Summary', 'Achievements', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [31, 41, 55] },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 50 },
                3: { cellWidth: 20 }
            }
        });

        currentY = doc.lastAutoTable.finalY + 20;
    }

    // Goals Table
    if (goals.length > 0) {
        if (currentY > 220) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Key Goals & Progress', 20, currentY);

        const goalData = goals.map(g => [
            g.title,
            g.status.replace('_', ' '),
            `${g.progress}%`,
            format(parseISO(g.endDate), 'MMM d, yyyy')
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Goal', 'Status', 'Progress', 'Deadline']],
            body: goalData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });
    }

    // Footer on all pages
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `PulseBoard - Work & Performance Intelligence Platform | Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    doc.save(`Performance_Report_${user.fullName.replace(' ', '_')}_${dateStr}.pdf`);
};

const INK: [number, number, number] = [11, 11, 18];
const MUTED: [number, number, number] = [90, 90, 102];
const HEAD: [number, number, number] = [236, 230, 255];

/**
 * Review-ready PDF built only from the user's saved records: wins grouped by
 * category with their impact notes, followed by the period's weekly reflections.
 */
export const exportReviewPdf = ({ review, periodLabel, userName }: {
    review: ReviewData;
    periodLabel: string;
    userName: string;
}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;

    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Performance review summary', margin, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text(`${userName}  ·  ${periodLabel}`, margin, 30);
    doc.text(`Generated ${format(new Date(), 'MMM d, yyyy')}`, pageWidth - margin, 30, { align: 'right' });

    doc.setTextColor(...INK);
    doc.setFontSize(11);
    const reflectionCount = review.reflections.length;
    doc.text(
        `${review.wins.length} win${review.wins.length === 1 ? '' : 's'} recorded  ·  ` +
        `${review.withImpact} with documented impact  ·  ` +
        `${reflectionCount} weekly reflection${reflectionCount === 1 ? '' : 's'}`,
        margin, 40,
    );

    let y = 50;
    const heading = (text: string) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...INK);
        doc.text(text, margin, y);
        y += 4;
    };

    if (review.wins.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.text('No wins were recorded in this period.', margin, y);
        y += 10;
    }

    for (const group of review.byCategory) {
        heading(`${group.category} (${group.wins.length})`);
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Date', 'Win', 'Impact', 'Status']],
            body: group.wins.map((w) => [
                format(parseISO(w.date), 'MMM d'),
                w.description?.trim() ? `${w.title}\n${w.description.trim()}` : w.title,
                w.impactNotes?.trim() || '—',
                w.status,
            ]),
            styles: { fontSize: 9, cellPadding: 2.5, valign: 'top', textColor: INK },
            headStyles: { fillColor: HEAD, textColor: INK, fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 70 }, 3: { cellWidth: 22 } },
        });
        y = doc.lastAutoTable.finalY + 10;
    }

    if (review.reflections.length > 0) {
        heading('Weekly reflections');
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Week', 'What went well', 'What was challenging', 'What I learned', 'Focus next']],
            body: review.reflections.map((r) => [
                format(parseISO(r.weekStart), 'MMM d'),
                r.workSummary || '—',
                r.blockers || '—',
                r.achievements || '—',
                r.supportNeeded || '—',
            ]),
            styles: { fontSize: 8.5, cellPadding: 2.5, valign: 'top', textColor: INK },
            headStyles: { fillColor: HEAD, textColor: INK, fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 16 } },
        });
    }

    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(`Winfolio  ·  Page ${i} of ${pages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    }

    const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    doc.save(`Review_${safe(userName) || 'summary'}_${safe(periodLabel)}.pdf`);
};
