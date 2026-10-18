import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Bug, TrendingUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ChangeLog, ChangeType } from "@/types";

const changeTypeConfig: Record<ChangeType, { label: string; icon: React.ReactNode; color: string }> = {
    feature: { label: 'Feature', icon: <Sparkles className="h-3 w-3" />, color: 'bg-primary/10 text-primary border-primary/20' },
    improvement: { label: 'Improvement', icon: <TrendingUp className="h-3 w-3" />, color: 'bg-success/10 text-success border-success/20' },
    bugfix: { label: 'Bug Fix', icon: <Bug className="h-3 w-3" />, color: 'bg-info/10 text-info border-info/20' },
    breaking: { label: 'Breaking', icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function ChangeLogDisplay() {
    const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'changeLogs'),
            orderBy('releaseDate', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs: ChangeLog[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                version: doc.data().version,
                releaseDate: doc.data().releaseDate,
                changeType: doc.data().changeType,
                title: doc.data().title,
                description: doc.data().description,
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            }));
            setChangeLogs(logs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Show hardcoded initial release if no logs exist
    const displayLogs = changeLogs.length > 0 ? changeLogs : [
        {
            id: '1',
            version: '2.0.0',
            releaseDate: new Date().toISOString(),
            changeType: 'feature' as ChangeType,
            title: 'PulseBoard 2.0 - Complete Platform Upgrade',
            description: 'Introducing weekly check-ins, goal tracking, manager dashboards, AI insights, and premium UI.',
            createdAt: new Date().toISOString(),
        },
    ];

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">What's New</CardTitle>
                        <CardDescription>Latest updates and improvements</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                        {displayLogs.map((log, index) => {
                            const config = changeTypeConfig[log.changeType];
                            return (
                                <div
                                    key={log.id}
                                    className="relative pl-6 pb-4 border-l-2 border-muted last:pb-0"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="text-xs font-mono">
                                                v{log.version}
                                            </Badge>
                                            <Badge variant="outline" className={`text-xs ${config.color}`}>
                                                {config.icon}
                                                <span className="ml-1">{config.label}</span>
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(log.releaseDate), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-sm">{log.title}</h4>
                                        <p className="text-sm text-muted-foreground">{log.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export function WhatsNewBanner() {
    const [latestLog, setLatestLog] = useState<ChangeLog | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, 'changeLogs'),
            orderBy('releaseDate', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.docs.length > 0) {
                const doc = snapshot.docs[0];
                setLatestLog({
                    id: doc.id,
                    version: doc.data().version,
                    releaseDate: doc.data().releaseDate,
                    changeType: doc.data().changeType,
                    title: doc.data().title,
                    description: doc.data().description,
                    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                });
            }
        });

        return () => unsubscribe();
    }, []);

    if (!latestLog || dismissed) return null;

    return (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 animate-fade-in">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{latestLog.title}</span>
                            <Badge variant="secondary" className="text-xs">v{latestLog.version}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{latestLog.description}</p>
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}
