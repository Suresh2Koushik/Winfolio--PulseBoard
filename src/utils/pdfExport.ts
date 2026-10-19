import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import type { ReviewData } from '@/lib/review';

// jspdf-autotable records where the last table ended
declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable: { finalY: number };
    }
}

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
