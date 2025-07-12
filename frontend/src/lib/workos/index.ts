import { WorkOS } from "@workos-inc/node";

let workosInstance: WorkOS | null = null;

export const workos =
  workosInstance || (workosInstance = new WorkOS(process.env.WORKOS_API_KEY!));
