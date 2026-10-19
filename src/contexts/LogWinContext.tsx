import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { Activity } from '@/types';
import { ActivityForm } from '@/components/ActivityForm';
import { useActivitiesContext } from '@/contexts/ActivitiesContext';
import { useCelebrate } from '@/contexts/CelebrationContext';

interface LogWinContextType {
  /** Open the "Log a win" dialog, or the edit dialog when given an existing win. */
  openLogWin: (edit?: Activity) => void;
}

const LogWinContext = createContext<LogWinContextType | undefined>(undefined);

export function LogWinProvider({ children }: { children: ReactNode }) {
  const { addActivity, updateActivity } = useActivitiesContext();
  const celebrate = useCelebrate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);

  const openLogWin = useCallback((edit?: Activity) => {
    setEditing(edit ?? null);
    setOpen(true);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setEditing(null);
  };

  return (
    <LogWinContext.Provider value={{ openLogWin }}>
      {children}
      <ActivityForm
        open={open}
        onOpenChange={handleOpenChange}
        editActivity={editing}
        onSave={async (data) => {
          if (editing) return updateActivity(editing.id, data);
          const saved = await addActivity(data);
          if (saved) celebrate("Win saved! Look at you go.");
          return saved;
        }}
      />
    </LogWinContext.Provider>
  );
}

export function useLogWin() {
  const context = useContext(LogWinContext);
  if (context === undefined) {
    throw new Error('useLogWin must be used within a LogWinProvider');
  }
  return context.openLogWin;
}
