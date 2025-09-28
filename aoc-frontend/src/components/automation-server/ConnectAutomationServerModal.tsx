"use client";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Copy, CheckCheck, Server, Loader2, CheckCircle } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useClipboard } from "use-clipboard-copy";
import { useAuth } from "@/context/AuthContext";
import { authenticatedBitswanBackendInstance } from "@/lib/api-client";
import { getActiveOrgFromCookies } from "@/data/organisations";

interface ConnectAutomationServerModalProps {
  children: React.ReactNode;
  apiUrl: string;
  onServerCreated?: (serverId: string) => void;
}

export function ConnectAutomationServerModal({
  children,
  apiUrl,
  onServerCreated,
}: ConnectAutomationServerModalProps) {
  const { user } = useAuth();
  const [serverName, setServerName] = useState("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [otp, setOtp] = useState<string | null>(null);
  const [automationServerId, setAutomationServerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [otpRedeemed, setOtpRedeemed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clipboard = useClipboard({
    onSuccess() {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    onError() {
      console.error("Failed to copy to clipboard");
    },
  });

  // Check OTP status every 3 seconds
  const checkOTPStatus = async () => {
    if (!automationServerId || otpRedeemed) return;

    try {
      const activeOrg = await getActiveOrgFromCookies();
      const apiClient = await authenticatedBitswanBackendInstance();
      const response = await apiClient.get(
        `/automation-servers/check-otp-status/?automation_server_id=${automationServerId}`,
        {
          headers: {
            "X-Org-Id": activeOrg?.id ?? "",
            "X-Org-Name": activeOrg?.name ?? "",
          },
        }
      );

      if (response.data.redeemed) {
        setOtpRedeemed(true);
        setIsCheckingStatus(false);
        
        // Clear the interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // Close modal after a short delay to show success state
        setTimeout(() => {
          setOpen(false);
          // Call the callback to refresh the automation servers list
          if (onServerCreated && automationServerId) {
            onServerCreated(automationServerId);
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to check OTP status:", err);
    }
  };

  // Start checking OTP status when OTP is generated
  useEffect(() => {
    if (otp && automationServerId && !otpRedeemed) {
      setIsCheckingStatus(true);
      // Check immediately
      checkOTPStatus();
      // Then check every 3 seconds
      intervalRef.current = setInterval(checkOTPStatus, 3000);
    }

    // Cleanup interval on unmount or when modal closes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [otp, automationServerId, otpRedeemed]);

  const handleCreateServer = async () => {
    if (!serverName.trim()) {
      setError("Server name is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const apiClient = await authenticatedBitswanBackendInstance();
      const activeOrg = await getActiveOrgFromCookies();
      
      const response = await apiClient.post('/automation-servers/create-with-otp/', {
        name: serverName.trim(),
      }, {
        headers: {
          "X-Org-Id": activeOrg?.id ?? "",
          "X-Org-Name": activeOrg?.name ?? "",
        },
      });

      const data = response.data;
      setOtp(data.otp);
      setAutomationServerId(data.automation_server_id);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to create automation server");
    } finally {
      setIsCreating(false);
    }
  };

  const command = otp && automationServerId 
    ? `bitswan register --name "${serverName || "my-automation-server"}" --aoc-api "${apiUrl}" --otp "${otp}" --server-id "${automationServerId}"`
    : `bitswan register --name "${serverName || "my-automation-server"}" --aoc-api "${apiUrl}"`;

  const handleCopy = () => {
    clipboard.copy(command);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset all state when modal closes
      setServerName("");
      setCopied(false);
      setOtp(null);
      setAutomationServerId(null);
      setError(null);
      setIsCheckingStatus(false);
      setOtpRedeemed(false);
      
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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
            {otpRedeemed ? 
              "Server connected successfully! The modal will close automatically." :
              otp ? 
                "Automation server created! Use the command below to register your automation server with this workspace." :
                "Enter a name for your automation server and click 'Create Server' to generate a registration command."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="server-name" className="text-sm font-medium">
              Server Name
            </label>
            <Input
              id="server-name"
              placeholder="my-automation-server"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              disabled={isCreating || !!otp}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!otp && (
            <Button 
              onClick={handleCreateServer} 
              disabled={isCreating || !serverName.trim()}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Server...
                </>
              ) : (
                "Create Server"
              )}
            </Button>
          )}

          {otp && !otpRedeemed && (
            <>
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-sm text-green-800">
                  <strong>Server created successfully!</strong> Your OTP is: <code className="font-mono bg-green-100 px-1 rounded">{otp}</code>
                </p>
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

              {isCheckingStatus && (
                <div className="rounded-md bg-blue-50 p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <p className="text-sm text-blue-800">
                      Waiting for CLI registration... This modal will close automatically when the server is connected.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {otpRedeemed && (
            <div className="rounded-md bg-green-50 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">
                  <strong>Success!</strong> Automation server has been connected successfully.
                </p>
              </div>
            </div>
          )}

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