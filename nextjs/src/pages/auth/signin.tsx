import { signIn, useSession } from "next-auth/react";

import React from "react";

export default function SigninPage() {
  const { data: session } = useSession();

  React.useEffect(() => {
    if (!session) {
      void signIn("keycloak", { callbackUrl: "/dashboard" });
    }
  }, [session]);

  return <div></div>;
}
