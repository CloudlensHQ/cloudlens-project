"use client";

import {
  QueryClient,
  QueryFunction,
  QueryKey,
  useMutation,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      meta: {
        headers: {
          "Content-Type": "application/json",
        },
      },
    },
    mutations: {
      meta: {
        headers: {
          "Content-Type": "application/json",
        },
      },
    },
  },
});

function useQueryOnce<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData>,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  return useQuery<TQueryFnData, TError, TData>({
    queryKey,
    queryFn,
    ...options,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export { QueryClient, queryClient, useMutation, useQuery, useQueryOnce };
