import { handleError } from "./errors";

export async function keyCloakSessionLogOut() {
  try {
    await fetch("/api/auth/logout", { method: "GET" });
  } catch (error) {
    handleError(error as Error, "Failed to end keycloak session");
  }
}
