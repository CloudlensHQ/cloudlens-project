import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/validator/validate
 * Validates AWS credentials by calling STS GetCallerIdentity
 * This endpoint should forward to the FastAPI backend which handles actual AWS SDK calls
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessKeyId, secretAccessKey, sessionToken, region } = body;

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { message: "Access Key ID and Secret Access Key are required" },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Forward to FastAPI backend for actual AWS validation
    const fastApiUrl = process.env.FASTAPI_BASE_URL || "http://localhost:8000";
    const validationResponse = await fetch(`${fastApiUrl}/api/validator/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        access_key_id: accessKeyId,
        secret_access_key: secretAccessKey,
        session_token: sessionToken,
        region: region || "us-east-1",
      }),
    });

    if (!validationResponse.ok) {
      const error = await validationResponse.json().catch(() => ({}));
      return NextResponse.json(error, { status: validationResponse.status });
    }

    const validationData = await validationResponse.json();
    return NextResponse.json(validationData);
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Validation failed",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/validator/history
 * Fetch validation history with pagination
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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";

    // Forward to FastAPI backend
    const fastApiUrl = process.env.FASTAPI_BASE_URL || "http://localhost:8000";
    const historyResponse = await fetch(
      `${fastApiUrl}/api/validator/history?limit=${limit}&offset=${offset}`,
      {
        headers: {
          "Authorization": authHeader,
        },
      }
    );

    if (!historyResponse.ok) {
      throw new Error("Failed to fetch history");
    }

    const historyData = await historyResponse.json();
    return NextResponse.json(historyData);
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to fetch history",
      },
      { status: 500 }
    );
  }
}
