"use client";

import { SessionProvider, signIn, useSession } from "next-auth/react";

import React from "react";

const SigninComponent = () => {
  const { data: session } = useSession();

  if (!session) {
    void signIn("keycloak", { callbackUrl: "/dashboard" });
  }

  return <div></div>;
};

export default function SignInPage() {
  return (
    <SessionProvider>
      <SigninComponent />
    </SessionProvider>
  );
}
