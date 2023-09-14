"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BellDot, LogIn, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "../ui/button";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import { keyCloakSessionLogOut } from "@/utils/keycloak";

interface TitleBarProps {
  title: string;
}

export function TitleBar(props: TitleBarProps) {
  const { title } = props;

  const { data: session, status } = useSession();

  const handleSignOut = () => {
    keyCloakSessionLogOut()
      .then(async (res) => {
        console.log(res);
        try {
          await signOut({ callbackUrl: "/" })
            .then((res) => console.log(res))
            .catch((err) => console.log(err));
        } catch (error) {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSignIn = () => {
    signIn("keycloak", {
      callbackUrl: "/",
    })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  };

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
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-slate-800">
                  {session.user.name}
                </div>
                <div className="text-sm underline">{session.user.email}</div>
              </div>
              <div className="flex gap-1">
                <BellDot size={25} className="my-auto" />
                <Button
                  variant={"ghost"}
                  onClick={handleSignOut}
                  className="hover:bg-transparent"
                >
                  <LogOut size={25} className="my-auto" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
