import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCreateOrg } from "@/hooks/useOrgsQuery";
import { ACTIVE_ORG_COOKIE_NAME } from "@/shared/constants";

interface CreateOrgDialogTriggerProps {
  onTriggerClick: () => void;
}

export function CreateOrgDialogTrigger({ onTriggerClick }: CreateOrgDialogTriggerProps) {
  const handleDropdownClick = () => {
    console.log("CreateOrgDialogTrigger - handleDropdownClick called");
    onTriggerClick();
  };

  return (
    <DropdownMenuItem
      className="gap-2 p-2"
      onClick={handleDropdownClick}
    >
      <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
        <Plus className="size-4" />
      </div>
      <div className="text-muted-foreground font-medium">
        Create Organization
      </div>
    </DropdownMenuItem>
  );
}

interface CreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrgDialog({ open, onOpenChange }: CreateOrgDialogProps) {
  console.log("CreateOrgDialog render - open state:", open);
  const navigate = useNavigate();
  const shouldReloadRef = useRef(false);
  
  // Handle page reload after component has finished rendering
  useLayoutEffect(() => {
    if (shouldReloadRef.current) {
      shouldReloadRef.current = false;
      // Use requestAnimationFrame to ensure it happens after the current render
      requestAnimationFrame(() => {
        window.location.reload();
      });
    }
  });
  
  const { mutate: createOrgMutation, isPending } = useCreateOrg();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("CreateOrgDialog - handleSubmit called");
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    console.log("CreateOrgDialog - submitting data:", { name });
    
    createOrgMutation(
      { name },
      {
        onSuccess: (result) => {
          console.log("CreateOrgDialog - onSuccess called with full result:", result);
          console.log("CreateOrgDialog - result structure:", JSON.stringify(result, null, 2));
          
          // Extract the organization ID from the result
          // The result structure is: { id: string, name: string, status: "success" } or { status: "error", message: string, data: null }
          if (result.status === "error") {
            console.error("CreateOrgDialog - Error creating organization:", result.message);
            toast.error(result.message ?? "Error creating organization");
            return;
          }
          
          const orgId = result.id;
          console.log("CreateOrgDialog - extracted orgId:", orgId);
          
          if (orgId) {
            console.log("CreateOrgDialog - Switching to organization:", orgId);
            // Switch to the newly created organization
            document.cookie = `${ACTIVE_ORG_COOKIE_NAME}=${orgId}; path=/; max-age=${60 * 60 * 24 * 30}`;
            
            // Close dialog
            onOpenChange(false);
            
            // Show success message
            toast.success("Organization created successfully");
            
            // Navigate to settings users tab
            navigate("/settings?activeTab=users");
            
            // Schedule page reload for after current render cycle
            shouldReloadRef.current = true;
          } else {
            console.error("CreateOrgDialog - No organization ID found in result:", result);
            toast.error("Organization created but failed to switch to it");
            onOpenChange(false);
          }
        },
        onError: (error: any) => {
          console.log("CreateOrgDialog - onError called:", error);
          const errorMessage = error?.message ?? "Error creating organization";
          toast.error(errorMessage);
          // Keep dialog open on error so user can retry
        },
      }
    );
  };

  console.log("CreateOrgDialog - rendering with open:", open, "isPending:", isPending);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-md"
          onPointerDownOutside={(event) => {
            console.log("CreateOrgDialog - onPointerDownOutside called");
            event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            console.log("CreateOrgDialog - onEscapeKeyDown called");
            event.preventDefault();
          }}
          onInteractOutside={(event) => {
            console.log("CreateOrgDialog - onInteractOutside called");
            event.preventDefault();
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Enter a name for your new organization.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="org-name">Name</Label>
                <Input
                  id="org-name"
                  name="name"
                  disabled={isPending}
                  required
                  placeholder="Organization Name"
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Creating..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}
