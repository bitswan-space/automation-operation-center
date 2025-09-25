import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiUrl = process.env.BITSWAN_BACKEND_API_URL;
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bitswanBackendApiUrl: apiUrl,
    });
  } catch (error) {
    console.error("Error getting config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
