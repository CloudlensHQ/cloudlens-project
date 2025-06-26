import { workos } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = async (request: NextRequest) => {
  try {
    const { user } = await request.json();

    // Validate required fields
    if (!user?.id) {
      return NextResponse.json(
        {
          error:
            "Looks like your session has expired. Please refresh the page.",
        },
        { status: 400 }
      );
    }

    await workos.userManagement.updateUser({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
};

export const DELETE = async (request: NextRequest) => {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await workos.userManagement.deleteUser(userId);
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
};
