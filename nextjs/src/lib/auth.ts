"use server";

import { type Session } from "next-auth";
import { type Result, ok, err } from "neverthrow";
import { auth } from "@/server/auth";

type AuthError =
  | { kind: "UNAUTHORIZED"; message: string }
  | { kind: "UNEXPECTED_ERROR"; message: string; details: string }
  | { kind: "EXPIRED_TOKEN"; message: string };

/**
 * Validates that a session exists and is valid
 *
 * @returns A Result containing either the valid session or an AuthError
 */
export const checkAuth = async (): Promise<Result<Session, AuthError>> => {
  const session = await auth();
  if (!session) {
    // TODO: Log User Out

    return err({
      kind: "UNAUTHORIZED",
      message: "User is Unauthorized",
    });
  }

  // TODO: Check if the session is expired

  // Return the valid session
  return ok(session);
};
