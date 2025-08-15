"use client";

import { handleLogout } from "@/lib/auth";

export default function SignOutPage() {
  void handleLogout();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}
