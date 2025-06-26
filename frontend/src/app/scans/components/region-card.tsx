import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RegionCardProps {
  region: {
    name: string;
    resourceCount: number;
    complianceScore: number;
  };
  onClick: () => void;
}

export function RegionCard({ region, onClick }: RegionCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg hover:bg-secondary-background transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle>{region.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between text-xs items-center">
        Total Resources{' '}
        <Badge variant="outline" className="text-green-600">
          {region.resourceCount}
        </Badge>
      </CardContent>
    </Card>
  );
}
