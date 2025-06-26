import { workos } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    const organizationId = request.nextUrl.searchParams.get("organization_id");

    if (!organizationId?.trim()) {
      return NextResponse.json(
        { error: "Organization ID is required and cannot be empty" },
        { status: 400 }
      );
    }

    const members = await workos.userManagement.listOrganizationMemberships({
      organizationId: organizationId.trim(),
    });

    if (!members?.data?.length) {
      return NextResponse.json({ members: [] });
    }

    const memberDetails = await Promise.all(
      members.data.map(async (member) => {
        try {
          const userData = await workos.userManagement.getUser(member.userId);
          return {
            id: member.userId,
            name:
              `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
              "-",
            email: userData.email || null,
            role: member.role?.slug || "member",
            membershipId: member.id,
            isOnline: Boolean(member.status),
            joinedDate: member.createdAt,
          };
        } catch (userError) {
          console.error(`Error fetching user ${member.userId}:`, userError);
          return {
            id: member.userId,
            name: "Unknown User",
            email: null,
            role: member.role?.slug || "member",
            membershipId: member.id,
            isOnline: Boolean(member.status),
            joinedDate: member.createdAt,
          };
        }
      })
    );

    return NextResponse.json(memberDetails);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch members",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest) => {
  const { id, role } = await request.json();

  await workos.userManagement.updateOrganizationMembership(id, {
    roleSlug: role,
  });
  return NextResponse.json({ message: "Member role updated" });
};
