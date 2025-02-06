import * as React from "react";

import {
  type UserInviteFormActionState,
  inviteUserAction,
} from "@/server/actions/users";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader } from "lucide-react";

export function UserInviteForm({}) {
  const [state, formAction, isPending] = React.useActionState<
    UserInviteFormActionState,
    FormData
  >(inviteUserAction, {});
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    if (state?.status === "success") {
      setInputValue("");
    }
  }, [state]);

  return (
    <form action={formAction}>
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
      {state?.errors?.email && (
        <p className="mb-1 text-xs text-red-400">{state.errors.email[0]}</p>
      )}
    </form>
  );
}
