import { queryClient } from "@/lib/react-query";

export const invalidateQuery = (queryKey: string[]) => {
  queryClient.invalidateQueries({ queryKey });
};
