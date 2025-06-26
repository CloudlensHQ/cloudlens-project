import { headers } from "next/headers";
import createClient from "openapi-fetch";
import type { paths } from "./v1";

let clientInstance: ReturnType<typeof createClient<paths>> | null = null;

export const client = (() => {
  if (!clientInstance) {
    clientInstance = createClient<paths>({
      baseUrl: process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL,
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        // Get the bearer token from the incoming request headers
        const headersList = await headers();
        const bearerToken = headersList.get("Authorization");
        if (!bearerToken) {
          return new Response(
            JSON.stringify({ error: "Authorization token required" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Merge the authorization header with existing headers
        const modifiedInit = {
          ...init,
          headers: {
            ...init?.headers,
            Authorization: bearerToken,
            "Content-Type": "application/json",
          },
        };

        return fetch(input, modifiedInit);
      },
    });
  }
  return clientInstance;
})();
