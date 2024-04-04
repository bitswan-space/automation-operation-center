import { signIn, useSession } from "next-auth/react";

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Signin() {
  const router = useRouter();
  const { status, data: session } = useSession();

  console.log("Status", status);


  useEffect(() => {
    console.log("Checking status", status);

    if (status === "unauthenticated" || session?.expired) {
      console.log("Unauthenticated: ", status, session?.expired);
      void signIn("keycloak", { callbackUrl: "/" });
    }

    if (status === "authenticated" && !session?.expired) {
      console.log("Authenticated: ", status);
      void router.push((router.query.callbackUrl as string) ?? "/");
    }

    if (status === "loading") {
      console.log("Loading: ", status);
    }
  }, [router, session?.expired, status]);

  return <div></div>;
}
