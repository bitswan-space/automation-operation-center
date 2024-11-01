"use client";

import React from "react";
import { useSession } from "next-auth/react";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    // redirect("/auth/signin");
    console.log("redirecting");
  }

  return <>{children}</>;
}
