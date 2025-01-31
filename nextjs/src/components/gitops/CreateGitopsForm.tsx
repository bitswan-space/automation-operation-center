"use client";

import { CheckCheck, Copy } from "lucide-react";
import {
  CreateGitopsActionState,
  createGitopsAction,
} from "@/server/actions/gitops";
import { HelpCircle, Loader } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";
import React from "react";
import useClipboard from "react-use-clipboard";

export function CreateGitopsForm() {
  const [state, formAction, isPending] = React.useActionState<
    CreateGitopsActionState,
    FormData
  >(createGitopsAction, {});

  const [secretKey, setSecretKey] = React.useState("");

  React.useEffect(() => {
    if (state.status === "success") {
      setSecretKey(state.data?.result?.secret_key ?? "");
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-8">
      <div>
        <Label className="flex gap-1">
          Gitops Name{" "}
          <span title="This is the name configured for your gitops.">
            <HelpCircle size={15} className="mr-2" />
          </span>
          :
        </Label>

        <Input
          placeholder="Example Name"
          defaultValue={state.data?.name}
          name="name"
        />

        {state?.errors?.name && (
          <p className="mb-1 text-xs text-red-400">{state.errors.name[0]}</p>
        )}

        <div>{secretKey && <TokenDisplay token={secretKey} />}</div>
      </div>

      <Button type="submit" disabled={isPending}>
        Add Gitops{" "}
        {isPending && (
          <span>
            <Loader size={20} className="ml-2 animate-spin" />
          </span>
        )}
      </Button>
    </form>
  );
}

type TokenDisplayProps = {
  token: string;
};
function TokenDisplay(props: Readonly<TokenDisplayProps>) {
  const { token } = props;

  const [isCopied, setCopied] = useClipboard(token, {});

  return (
    <div className="rounded-md bg-green-100/70 p-4">
      <div className="pb-2 text-xs text-green-950">
        Gitops successfuly setup. Copy gitops token below and store securely:
      </div>
      <div className="flex justify-between">
        <div className="rounded-md bg-neutral-50 px-4 py-1 text-sm">
          {token}
        </div>
        <div className="flex gap-4">
          <div>
            {isCopied && <Badge className="bg-neutral-700">Copied!</Badge>}
          </div>
          {isCopied ? (
            <CheckCheck size={20} />
          ) : (
            <Copy size={20} onClick={setCopied} className="cursor-pointer" />
          )}
        </div>
      </div>
    </div>
  );
}
