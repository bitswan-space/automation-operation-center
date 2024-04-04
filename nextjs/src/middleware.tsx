import { env } from "./env.mjs";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    // void signIn("keycloak");
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log("Token is valid");
        return !!token?.access_token && !token?.expired;
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    secret: env.NEXTAUTH_SECRET,
  },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)", "/"],
};
