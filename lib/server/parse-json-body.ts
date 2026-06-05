import { NextResponse } from "next/server";

/**
 * Parse a JSON request body. Returns 400 on malformed JSON instead of throwing
 * into a generic 500 handler.
 */
export async function parseJsonBody(
  request: Request
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; response: NextResponse }> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      ),
    };
  }
}
