import { NextResponse } from "next/server";
import { getAuthenticatedUser, toPublicUser } from "@/lib/server/auth";

/** Verify session cookie and return current user profile, or 401. */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
  }
  return NextResponse.json({ success: true, user: toPublicUser(user) });
}
