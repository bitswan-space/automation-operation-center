import SignIn from "@/components/auth/signin";
import { Suspense } from "react";

export default async function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        <SignIn />
      </Suspense>
    </div>
  );
}
