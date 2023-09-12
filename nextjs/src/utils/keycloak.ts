export async function keyCloakSessionLogOut() {
  try {
    await fetch("/api/auth/logout", { method: "GET" });
    debugger;
  } catch (error) {
    console.error(error);
  }
}
