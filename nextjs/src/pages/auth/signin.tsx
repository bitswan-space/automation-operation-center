import { signIn, useSession } from "next-auth/react";

export default function Signin() {
  const { data: session } = useSession();

  if (!session) {
    void signIn("keycloak", { callbackUrl: "/" });
  }

  return <div></div>;
}
