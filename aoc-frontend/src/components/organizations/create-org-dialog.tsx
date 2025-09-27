import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrgAction } from "./actions";
import { toast } from "sonner";
import { useAction } from "@/hooks/useAction";

export function CreateOrgDialog() {
  const { execute, isPending } = useAction(createOrgAction, {
    onSuccess: () => {
      toast.success("Organization created");
    },
    onError: ({ error: { serverError } }) => {
      toast.error(serverError?.message ?? "Error creating organization");
    },
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem
          className="gap-2 p-2"
          onSelect={(e) => e.preventDefault()}
        >
          <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
            <Plus className="size-4" />
          </div>
          <div className="text-muted-foreground font-medium">
            Create Organization
          </div>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={execute} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
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
            <DialogClose asChild>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Creating..." : "Save"}
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
