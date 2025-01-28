import NextAuth from "next-auth";
import { authConfig } from "./config";
import { cache } from "react";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
