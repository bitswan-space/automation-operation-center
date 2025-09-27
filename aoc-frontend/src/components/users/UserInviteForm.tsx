import * as React from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader } from "lucide-react";
import { inviteUserAction } from "./actions";
import { toast } from "sonner";
import { useAction } from "@/hooks/useAction";

export function UserInviteForm({}) {
  const [inputValue, setInputValue] = React.useState("");

  const { execute, isPending, result } = useAction(inviteUserAction, {
    onSuccess: () => {
      setInputValue("");
      toast.success("User invited");
    },
    onError: ({ error }) => {
      toast.error((error as any)?.serverError?.message ?? "Error inviting user");
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
    </form>
  );
}
