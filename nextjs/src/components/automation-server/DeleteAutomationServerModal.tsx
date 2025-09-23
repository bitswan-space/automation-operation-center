"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteAutomationServerModalProps {
  children: React.ReactNode;
  serverName: string;
  serverId: string;
  onDelete?: () => void;
}

export function DeleteAutomationServerModal({
  children,
  serverName,
  serverId,
  onDelete,
}: DeleteAutomationServerModalProps) {
  const [confirmationName, setConfirmationName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const isNameValid = confirmationName === serverName;

  const handleDelete = async () => {
    if (!isNameValid) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/automation-servers/${serverId}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: confirmationName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        if (response.status === 403) {
          throw new Error("You don't have permission to delete this automation server. Only admin users can delete automation servers.");
        }
        throw new Error(errorData.error ?? "Failed to delete automation server");
      }

      // Close modal and redirect
      setOpen(false);
      router.push("/dashboard/automation-servers");
      onDelete?.();
    } catch (error) {
      console.error("Error deleting automation server:", error);
      // You might want to show a toast notification here
      alert(error instanceof Error ? error.message : "Failed to delete automation server");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmationName("");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Automation Server
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the automation server{" "}
            <strong>&quot;{serverName}&quot;</strong> and all its associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="confirmation-name" className="text-sm font-medium">
              To confirm deletion, type the server name: <strong>&quot;{serverName}&quot;</strong>
            </label>
            <Input
              id="confirmation-name"
              placeholder={serverName}
              value={confirmationName}
              onChange={(e) => setConfirmationName(e.target.value)}
              className={confirmationName && !isNameValid ? "border-red-500" : ""}
            />
            {confirmationName && !isNameValid && (
              <p className="text-sm text-red-600">
                Server name does not match. Please enter the exact name.
              </p>
            )}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isNameValid || isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Server"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
