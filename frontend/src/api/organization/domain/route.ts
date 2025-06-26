import { workos } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    const organizationId = request.nextUrl.searchParams.get("organization_id");
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }
    const org = await workos.organizations.getOrganization(organizationId);
    return NextResponse.json(org.domains[0] ?? null);
  } catch (error) {
    console.error("Error fetching organization domain:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization domain" },
      { status: 500 }
    );
  }
};
