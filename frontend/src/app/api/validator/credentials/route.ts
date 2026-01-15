import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/validator/credentials
 * Save AWS credentials (encrypted on backend)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, credentials, tags } = body;

    if (!name || !credentials) {
      return NextResponse.json(
        { message: "Name and credentials are required" },
        { status: 400 }
      );
    }

    // Forward to FastAPI backend
    const fastApiUrl = process.env.FASTAPI_BASE_URL || "http://localhost:8000";
    const saveResponse = await fetch(`${fastApiUrl}/api/validator/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        name,
        credentials,
        tags: tags || [],
      }),
    });

    if (!saveResponse.ok) {
      const error = await saveResponse.json().catch(() => ({}));
      return NextResponse.json(error, { status: saveResponse.status });
    }

    const savedData = await saveResponse.json();
    return NextResponse.json(savedData);
  } catch (error) {
    console.error("Save credentials error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to save credentials",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/validator/credentials
 * Fetch saved credentials list (without secrets)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Forward to FastAPI backend
    const fastApiUrl = process.env.FASTAPI_BASE_URL || "http://localhost:8000";
    const credResponse = await fetch(`${fastApiUrl}/api/validator/credentials`, {
      headers: {
        "Authorization": authHeader,
      },
    });

    if (!credResponse.ok) {
      throw new Error("Failed to fetch credentials");
    }

    const credData = await credResponse.json();
    return NextResponse.json(credData);
  } catch (error) {
    console.error("Fetch credentials error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to fetch credentials",
      },
      { status: 500 }
    );
  }
}
