import * as React from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { useInviteUser } from "@/hooks/useUsersQuery";
import { EmailSetupDialog } from "../ui/email-setup-dialog";

type UserInviteFormProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function UserInviteForm({ search, onSearchChange }: UserInviteFormProps) {
  const [showEmailDialog, setShowEmailDialog] = React.useState(false);
  const [dialogData, setDialogData] = React.useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const inviteUserMutation = useInviteUser();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailInput = e.currentTarget.querySelector('input[type="email"]') as HTMLInputElement;
    const email = formData.get("email") as string;
    
    // Use browser's native email validation
    if (!emailInput || !emailInput.checkValidity()) {
      emailInput?.reportValidity();
      return;
    }
    
    inviteUserMutation.mutate(email.trim(), {
      onSuccess: (result) => {
        onSearchChange("");
        
        // Check if email was sent successfully
        if ((result as any).email_sent) {
          toast.success("User invited successfully");
        } else {
          // Show dialog with temporary password
          setDialogData({
            email: email,
            temporaryPassword: (result as any).temporary_password || ""
          });
          setShowEmailDialog(true);
        }
      },
      onError: (error) => {
        const errorMessage = (error as any)?.message ?? "Error inviting user";
        toast.error(errorMessage);
      },
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-4 py-4">
          <Input
            type="email"
            placeholder="Team member email"
            className="w-full"
            onChange={(e) => onSearchChange(e.target.value)}
            value={search}
            name="email"
            required
          />
          <Button
            className="mb-auto bg-blue-600 hover:bg-blue-700/80"
            disabled={inviteUserMutation.isPending}
            type="submit"
          >
            Invite{" "}
            {inviteUserMutation.isPending && (
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
          onOpenChange={(open) => {
            setShowEmailDialog(open);
          }}
          email={dialogData.email}
          temporaryPassword={dialogData.temporaryPassword}
        />
      )}
    </>
  );
}
