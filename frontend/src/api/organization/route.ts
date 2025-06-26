import { workos } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const user_id = request.nextUrl.searchParams.get("user_id");
  const orgs = await workos.userManagement.listOrganizationMemberships({
    userId: user_id?.trim(),
  });
  const orgsData = await Promise.all(
    orgs.data.map(async (org) => {
      const orgData = await workos.organizations.getOrganization(
        org.organizationId
      );
      return orgData;
    })
  );
  return NextResponse.json(orgsData);
};
