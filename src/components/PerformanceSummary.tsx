import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    ArrowRight,
    CheckCircle2,
    TrendingUp,
    AlertTriangle,
    Download,
    Calendar,
    Loader2,
    Save,
    Edit2
} from "lucide-react";
import { PerformanceSummary, CheckIn, Goal } from "@/types";
import { format } from "date-fns";
import { generatePerformanceInsights } from "@/utils/aiInsights";
import { cn } from "@/lib/utils";
import { Textarea } from '@/components/ui/textarea';

interface PerformanceSummaryUIProps {
    summary?: PerformanceSummary;
    checkIns: CheckIn[];
    goals: Goal[];
    employeeName: string;
    isManager?: boolean;
    onSave?: (summary: Omit<PerformanceSummary, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export function PerformanceSummaryUI({
    summary,
    checkIns,
    goals,
    employeeName,
    isManager = false,
    onSave
}: PerformanceSummaryUIProps) {
    const [generating, setGenerating] = useState(false);
    const [editing, setEditing] = useState(false);
    const [localSummary, setLocalSummary] = useState<Partial<PerformanceSummary>>(summary || {});

    const handleGenerate = async () => {
        setGenerating(true);
        // Simulate AI delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - 30);
        const periodEnd = new Date();

        const result = generatePerformanceInsights({
            checkIns,
            goals,
            periodStart,
            periodEnd,
            employeeName
        });

        setLocalSummary(result);
        setGenerating(false);
        if (isManager) setEditing(true);
    };

    const handleSave = async () => {
        if (onSave && localSummary.contributions) {
            setGenerating(true);
            await onSave(localSummary as Omit<PerformanceSummary, 'id' | 'createdAt' | 'updatedAt'>);
            setEditing(false);
            setGenerating(false);
        }
    };

    const currentSummary = localSummary.contributions ? localSummary : summary;

    if (!currentSummary?.contributions && !generating) {
        return (
            <Card className="border-dashed bg-primary/5">
                <CardContent className="py-12 text-center">
                    <Sparkles className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold mb-2">Generate Performance Insights</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Analyze recent check-ins and goal progress to generate an AI-powered summary of achievements and growth areas.
                    </p>
                    <Button onClick={handleGenerate} className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Generate Monthly Summary
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {isManager && !editing && (
                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
                        <Edit2 className="h-4 w-4" />
                        Edit Summary
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Regenerate
                    </Button>
                </div>
            )}

            {generating ? (
                <Card className="animate-pulse">
                    <CardContent className="py-20 text-center">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Analyzing performance data...</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contributions & Strengths */}
                    <div className="space-y-6">
                        <Card className="card-glass h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-success/10">
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                    </div>
                                    <CardTitle>Key Contributions</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {editing ? (
                                    <Textarea
                                        value={localSummary.contributions}
                                        onChange={e => setLocalSummary({ ...localSummary, contributions: e.target.value })}
                                        className="min-h-[150px]"
                                    />
                                ) : (
                                    <p className="text-sm leading-relaxed">{currentSummary.contributions}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="card-glass h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle>Core Strengths</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {editing ? (
                                    <Textarea
                                        value={localSummary.strengths}
                                        onChange={e => setLocalSummary({ ...localSummary, strengths: e.target.value })}
                                        className="min-h-[150px]"
                                    />
                                ) : (
                                    <p className="text-sm leading-relaxed">{currentSummary.strengths}</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Improvements & Risks */}
                    <div className="space-y-6">
                        <Card className="card-glass h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-info/10">
                                        <ArrowRight className="h-5 w-5 text-info" />
                                    </div>
                                    <CardTitle>Areas for Improvement</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {editing ? (
                                    <Textarea
                                        value={localSummary.improvements}
                                        onChange={e => setLocalSummary({ ...localSummary, improvements: e.target.value })}
                                        className="min-h-[150px]"
                                    />
                                ) : (
                                    <p className="text-sm leading-relaxed">{currentSummary.improvements}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="card-glass h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-destructive/10">
                                        <AlertTriangle className="h-5 w-5 text-destructive" />
                                    </div>
                                    <CardTitle>Notable Risks</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {editing ? (
                                    <Textarea
                                        value={localSummary.risks}
                                        onChange={e => setLocalSummary({ ...localSummary, risks: e.target.value })}
                                        className="min-h-[150px]"
                                    />
                                ) : (
                                    <p className="text-sm leading-relaxed">{currentSummary.risks}</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {editing && (
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Summary
                    </Button>
                </div>
            )}

            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Period: {format(new Date(currentSummary.periodStart!), 'MMM d')} - {format(new Date(currentSummary.periodEnd!), 'MMM d, yyyy')}</span>
                </div>
                {!editing && (
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export to PDF
                    </Button>
                )}
            </div>
        </div>
    );
}
