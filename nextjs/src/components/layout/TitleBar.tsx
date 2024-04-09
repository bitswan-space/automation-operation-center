"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BellDot, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { signIn, useSession } from "next-auth/react";

import { Button } from "../ui/button";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import { handleError } from "@/utils/errors";

interface TitleBarProps {
  title: string;
}

export function TitleBar(props: Readonly<TitleBarProps>) {
  const { title } = props;

  const { data: session, status } = useSession();

  const handleSignIn = () => {
    signIn("keycloak", {
      callbackUrl: "/",
    })
      .then((res) => console.info(res))
      .catch((error: Error) => {
        handleError(error, "Failed to sign in");
      });
  };

  const getInitials = (name: string) => {
    const [firstName, lastName] = name.split(" ");
    return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`;
  };

  console.log("session", session);

  return (
    <div className="hidden md:block">
      <Card
        className={
          "h-full w-full rounded-lg border border-slate-300 shadow-none"
        }
      >
        <CardContent className="flex justify-between px-5 py-4">
          <h1 className="text-3xl font-bold text-stone-700 md:text-2xl">
            {title}
          </h1>
          {status === "loading" && (
            <div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-12 w-12" />
              </div>
            </div>
          )}
          {status === "unauthenticated" && (
            <div>
              <Button onClick={handleSignIn}>
                <LogIn className="mr-2" size={20} />
                Login
              </Button>
            </div>
          )}
          {status === "authenticated" && session && (
            <div className="flex gap-4 pr-2">
              <div className="hidden gap-1">
                <BellDot size={25} className="my-auto" />
              </div>
              <Avatar>
                <AvatarImage src="#" />
                <AvatarFallback className="bg-neutral-700 font-bold uppercase text-neutral-200">
                  {getInitials(session.user.name ?? "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-slate-800">
                  {session.user.name}
                </div>
                <div className="text-sm underline">{session.user.email}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
