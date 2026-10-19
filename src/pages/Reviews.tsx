import { useActivities } from "@/hooks/useActivities";
import { useCheckIns } from "@/hooks/useCheckIns";
import { ListSkeleton, Page } from "@/components/app/ui";
import { ReviewGenerator } from "./ReviewGenerator";

export default function Reviews() {
  const { activities, loading: loadingWins } = useActivities();
  const { checkIns, loading: loadingReflections } = useCheckIns();

  return (
    <Page>
      {loadingWins || loadingReflections
        ? <ListSkeleton rows={3} />
        : <ReviewGenerator activities={activities} checkIns={checkIns} />}
    </Page>
  );
}
