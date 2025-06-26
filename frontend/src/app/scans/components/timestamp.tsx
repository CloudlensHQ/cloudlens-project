import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface TimestampSelectorProps {
  timestamps: string[];
  onSelect: (timestamp: string) => void;
  isLoading?: boolean;
}

export function TimestampSelector({
  timestamps,
  onSelect,
  isLoading = false,
}: TimestampSelectorProps) {
  if (isLoading) {
    return <Skeleton className="h-9 w-[200px]" />;
  }

  return (
    <Select onValueChange={onSelect} defaultValue={timestamps[0]}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select timestamp" />
      </SelectTrigger>
      <SelectContent>
        {timestamps.map((timestamp) => (
          <SelectItem key={timestamp} value={timestamp}>
            {timestamp}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
