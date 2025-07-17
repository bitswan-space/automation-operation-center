import * as React from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader } from "lucide-react";
import { inviteUserAction } from "./actions";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";

export function UserInviteForm({}) {
  const [inputValue, setInputValue] = React.useState("");

  const { execute, isPending, result } = useAction(inviteUserAction, {
    onSuccess: () => {
      setInputValue("");
      toast.success("User invited");
    },
    onError: ({ error }) => {
      toast.error(error.serverError?.message ?? "Error inviting user");
    },
  });

  return (
    <form action={execute}>
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="Team member email "
          className="w-full"
          onChange={(e) => setInputValue(e.target.value)}
          value={inputValue}
          name="email"
        />
        <Button
          className="mb-auto bg-blue-600 hover:bg-blue-700/80"
          disabled={isPending}
          type="submit"
        >
          Invite{" "}
          {isPending && (
            <span>
              <Loader size={20} className="ml-2 animate-spin" />
            </span>
          )}
        </Button>
      </div>
      {result?.validationErrors?.email && (
        <p className="mb-1 text-xs text-red-400">
          {result?.validationErrors?.email._errors?.[0]}
        </p>
      )}
    </form>
  );
}
