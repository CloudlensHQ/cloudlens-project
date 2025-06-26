import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function RegionCardSkeleton() {
  return (
    <Card className="hover:bg-accent cursor-pointer">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-[120px]" /> {/* Region name */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" /> {/* Resource count */}
              <Skeleton className="h-4 w-[140px]" /> {/* Compliance score */}
            </div>
            <Skeleton className="h-8 w-8 rounded-full" /> {/* Icon */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
