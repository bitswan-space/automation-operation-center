"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { useEffect } from "react";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const callbackUrl = searchParams?.get("callbackUrl") ?? "/dashboard";
  const error = searchParams?.get("error");

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
      return;
    }

    if (status === "unauthenticated") {
      signIn("keycloak", {
        callbackUrl,
        // redirect: true,
      })
        .then((res) => {
          console.log("signin success", res);
        })
        .catch((err) => {
          console.log("signin error", err);
        });
    }
  }, [status, callbackUrl, router]);

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <h1>Authentication Error</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  return <div className="animate-pulse">Loading...</div>;
}
