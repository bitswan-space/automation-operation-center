"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, CheckCheck, Server } from "lucide-react";
import React, { useState } from "react";
import { useClipboard } from "use-clipboard-copy";

interface ConnectAutomationServerModalProps {
  children: React.ReactNode;
  apiUrl: string;
}

export function ConnectAutomationServerModal({
  children,
  apiUrl,
}: ConnectAutomationServerModalProps) {
  const [serverName, setServerName] = useState("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const clipboard = useClipboard({
    onSuccess() {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    onError() {
      console.error("Failed to copy to clipboard");
    },
  });

  const command = `bitswan register --name "${serverName || "my-automation-server"}" --aoc-api "${apiUrl}"`;

  const handleCopy = () => {
    clipboard.copy(command);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setServerName("");
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Connect Automation Server
          </DialogTitle>
          <DialogDescription>
            Use the command below to register your automation server with this workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="server-name" className="text-sm font-medium">
              Server Name (optional)
            </label>
            <Input
              id="server-name"
              placeholder="my-automation-server"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Command to run:</label>
            <div className="relative">
              <Input
                value={command}
                readOnly
                className="pr-10 font-mono text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={handleCopy}
              >
                {copied ? (
                  <CheckCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="rounded-md bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Make sure you have the bitswan CLI installed on the server. See the{" "}
              <a
                href="https://github.com/bitswan-space/bitswan-automation-server?tab=readme-ov-file#installation"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-900 hover:text-blue-700"
              >
                installation instructions
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
