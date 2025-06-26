import { WorkOS } from "@workos-inc/node";

let workosInstance: WorkOS | null = null;

if (!process.env.WORKOS_API_KEY) {
  throw new Error('WORKOS_API_KEY environment variable is not set');
}

export const workos = workosInstance || (workosInstance = new WorkOS(process.env.WORKOS_API_KEY));
