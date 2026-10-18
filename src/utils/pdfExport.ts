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

export const exportActivityHistory = (activities: Activity[], userName: string) => {
    const doc = new jsPDF();
    const dateStr = format(new Date(), 'MMM d, yyyy');

    doc.setFontSize(20);
    doc.text('Work Activity History', 20, 20);
    doc.setFontSize(10);
    doc.text(`User: ${userName}`, 20, 30);
    doc.text(`Date: ${dateStr}`, 20, 35);

    const tableData = activities.map(a => [
        format(parseISO(a.date), 'MMM d, yyyy'),
        a.title,
        a.category,
        a.status,
        a.teams.join(', ')
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Date', 'Title', 'Category', 'Status', 'Teams']],
        body: tableData,
        headStyles: { fillColor: [31, 41, 55] }
    });

    doc.save(`Activity_History_${userName.replace(' ', '_')}_${dateStr}.pdf`);
};

export const exportToPDF = (activities: Activity[], periodLabel: string) => {
    exportActivityHistory(activities, periodLabel);
};

