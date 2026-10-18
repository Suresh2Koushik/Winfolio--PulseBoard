import { CheckIn, Goal, PerformanceSummary } from '@/types';
import { format, differenceInDays, parseISO } from 'date-fns';

interface AIInsightInput {
    checkIns: CheckIn[];
    goals: Goal[];
    periodStart: Date;
    periodEnd: Date;
    employeeName?: string;
}

export function generatePerformanceInsights(input: AIInsightInput): Omit<PerformanceSummary, 'id' | 'employeeId' | 'managerId' | 'createdAt' | 'updatedAt'> {
    const { checkIns, goals, periodStart, periodEnd, employeeName = 'Employee' } = input;

    // Filter data for the period
    const periodCheckIns = checkIns.filter(c => {
        const date = parseISO(c.weekStart);
        return date >= periodStart && date <= periodEnd;
    });

    const periodGoals = goals;
    const completedGoals = periodGoals.filter(g => g.status === 'completed');
    const goalsAtRisk = periodGoals.filter(g => g.status === 'at_risk' || g.status === 'behind');

    // Analyze achievements
    const allAchievements = periodCheckIns
        .filter(c => c.achievements)
        .map(c => c.achievements!)
        .join(' ');

    // Analyze blockers
    const allBlockers = periodCheckIns
        .filter(c => c.blockers)
        .map(c => c.blockers!)
        .join(' ');

    // Calculate category distribution
    const categoryCount: Record<string, number> = {};
    periodCheckIns.forEach(c => {
        c.categories?.forEach(cat => {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
    });

    const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

    // Generate contributions summary
    const contributions = generateContributions(periodCheckIns, completedGoals, topCategories, employeeName);

    // Generate strengths
    const strengths = generateStrengths(periodCheckIns, completedGoals, topCategories, employeeName);

    // Generate improvements
    const improvements = generateImprovements(periodCheckIns, goalsAtRisk, allBlockers, employeeName);

    // Generate risks
    const risks = generateRisks(periodCheckIns, goalsAtRisk, allBlockers);

    return {
        employeeName,
        periodStart: format(periodStart, 'yyyy-MM-dd'),
        periodEnd: format(periodEnd, 'yyyy-MM-dd'),
        contributions,
        strengths,
        improvements,
        risks,
    };
}

function generateContributions(
    checkIns: CheckIn[],
    completedGoals: Goal[],
    topCategories: string[],
    name: string
): string {
    const checkInCount = checkIns.length;
    const goalCount = completedGoals.length;

    let summary = `During this period, ${name} submitted ${checkInCount} weekly check-in${checkInCount !== 1 ? 's' : ''} `;

    if (goalCount > 0) {
        summary += `and completed ${goalCount} goal${goalCount !== 1 ? 's' : ''}. `;
    } else {
        summary += `. `;
    }

    if (topCategories.length > 0) {
        summary += `Primary focus areas included ${topCategories.slice(0, 2).join(' and ')}. `;
    }

    const achievementHighlights = checkIns
        .filter(c => c.achievements)
        .slice(0, 2)
        .map(c => c.achievements!.split('.')[0])
        .filter(a => a.length > 10);

    if (achievementHighlights.length > 0) {
        summary += `Key accomplishments: ${achievementHighlights.join('; ')}.`;
    }

    return summary;
}

function generateStrengths(
    checkIns: CheckIn[],
    completedGoals: Goal[],
    topCategories: string[],
    name: string
): string {
    const strengths: string[] = [];

    // Consistency
    if (checkIns.length >= 4) {
        strengths.push('Consistent in submitting weekly check-ins, demonstrating strong accountability');
    }

    // Goal completion
    if (completedGoals.length >= 2) {
        strengths.push(`Successfully completed ${completedGoals.length} goals, showing strong execution capabilities`);
    }

    // Category expertise
    if (topCategories.length > 0) {
        strengths.push(`Shows expertise in ${topCategories[0]}`);
    }

    // Achievement-focused
    const achievementCount = checkIns.filter(c => c.achievements && c.achievements.length > 20).length;
    if (achievementCount >= checkIns.length * 0.7) {
        strengths.push('Consistently highlights meaningful achievements');
    }

    if (strengths.length === 0) {
        return `${name} is developing their tracking habits. Encourage consistent check-ins to better identify strengths.`;
    }

    return strengths.join('. ') + '.';
}

function generateImprovements(
    checkIns: CheckIn[],
    goalsAtRisk: Goal[],
    blockers: string,
    name: string
): string {
    const improvements: string[] = [];

    // Check-in consistency
    if (checkIns.length < 3) {
        improvements.push('Consider submitting check-ins more consistently for better visibility into progress');
    }

    // Goals at risk
    if (goalsAtRisk.length > 0) {
        improvements.push(`${goalsAtRisk.length} goal${goalsAtRisk.length !== 1 ? 's are' : ' is'} at risk. Consider reprioritizing or seeking support`);
    }

    // Blockers not addressed
    if (blockers.length > 50) {
        improvements.push('Multiple blockers have been reported. Proactively escalate if support is needed');
    }

    // Missing achievements
    const noAchievements = checkIns.filter(c => !c.achievements || c.achievements.length < 10).length;
    if (noAchievements > checkIns.length * 0.5) {
        improvements.push('Add more detail to achievements sections to better showcase contributions');
    }

    if (improvements.length === 0) {
        return 'Continue the great work! Consider setting stretch goals for additional growth.';
    }

    return improvements.join('. ') + '.';
}

function generateRisks(
    checkIns: CheckIn[],
    goalsAtRisk: Goal[],
    blockers: string
): string {
    const risks: string[] = [];

    // Many goals at risk
    if (goalsAtRisk.length >= 2) {
        risks.push(`${goalsAtRisk.length} goals are at risk or behind schedule`);
    }

    // Recurring blockers
    if (blockers.length > 100) {
        risks.push('Recurring blockers detected that may impact deliverables');
    }

    // Inconsistent check-ins might indicate workload issues
    if (checkIns.length < 2) {
        risks.push('Low check-in frequency may indicate capacity constraints');
    }

    // Overdue goals
    const overdueGoals = goalsAtRisk.filter(g => parseISO(g.endDate) < new Date());
    if (overdueGoals.length > 0) {
        risks.push(`${overdueGoals.length} goal${overdueGoals.length !== 1 ? 's are' : ' is'} past the deadline`);
    }

    if (risks.length === 0) {
        return 'No significant risks identified. Performance appears to be stable.';
    }

    return risks.join('. ') + '.';
}

// Detect workload/burnout risks from check-in patterns
export function detectWorkloadRisks(checkIns: CheckIn[]): { level: 'low' | 'medium' | 'high'; reasons: string[] } {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check for frequent blockers
    const blockerCount = checkIns.filter(c => c.blockers && c.blockers.length > 20).length;
    if (blockerCount > 3) {
        reasons.push('Frequent blockers reported');
        riskScore += 2;
    } else if (blockerCount > 1) {
        reasons.push('Some blockers reported');
        riskScore += 1;
    }

    // Check for support requests
    const supportCount = checkIns.filter(c => c.supportNeeded && c.supportNeeded.length > 20).length;
    if (supportCount > 2) {
        reasons.push('Multiple support requests');
        riskScore += 2;
    }

    // Check for overtime indicators (keywords in summaries)
    const overtimeKeywords = ['overtime', 'weekend', 'late night', 'overwhelm', 'stress', 'burnout'];
    const overtimeCount = checkIns.filter(c =>
        overtimeKeywords.some(k => c.workSummary.toLowerCase().includes(k))
    ).length;
    if (overtimeCount > 0) {
        reasons.push('Potential workload concerns in check-ins');
        riskScore += overtimeCount;
    }

    let level: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 4) level = 'high';
    else if (riskScore >= 2) level = 'medium';

    return { level, reasons };
}
