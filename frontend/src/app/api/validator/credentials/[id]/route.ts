import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/validator/credentials/[id]
 * Delete saved credentials
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Forward to FastAPI backend
    const fastApiUrl = process.env.FASTAPI_BASE_URL || "http://localhost:8000";
    const deleteResponse = await fetch(
      `${fastApiUrl}/api/validator/credentials/${id}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": authHeader,
        },
      }
    );

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json().catch(() => ({}));
      return NextResponse.json(error, { status: deleteResponse.status });
    }

    return NextResponse.json({ message: "Credentials deleted successfully" });
  } catch (error) {
    console.error("Delete credentials error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to delete credentials",
      },
      { status: 500 }
    );
  }
}
