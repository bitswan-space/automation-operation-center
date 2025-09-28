import * as React from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader } from "lucide-react";
import { inviteUserAction } from "./actions";
import { toast } from "sonner";
import { useAction } from "@/hooks/useAction";
import { EmailSetupDialog } from "../ui/email-setup-dialog";

export function UserInviteForm({}) {
  const [inputValue, setInputValue] = React.useState("");
  const [showEmailDialog, setShowEmailDialog] = React.useState(false);
  const [dialogData, setDialogData] = React.useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const { execute, isPending } = useAction(inviteUserAction, {
    onSuccess: (result) => {
      setInputValue("");
      
      // Check if email was sent successfully
      if (result.email_sent) {
        toast.success("User invited successfully");
      } else {
        // Show dialog with temporary password
        setDialogData({
          email: inputValue,
          temporaryPassword: result.temporary_password || ""
        });
        setShowEmailDialog(true);
      }
    },
    onError: ({ error }) => {
      const errorMessage = (error as any)?.serverError?.message ?? "Error inviting user";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
    };
    await execute(data);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
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
      
      {dialogData && (
        <EmailSetupDialog 
          open={showEmailDialog} 
          onOpenChange={setShowEmailDialog}
          email={dialogData.email}
          temporaryPassword={dialogData.temporaryPassword}
        />
      )}
    </>
  );
}
