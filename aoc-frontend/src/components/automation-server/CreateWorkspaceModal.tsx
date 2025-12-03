"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { getAutomationServerMQTTToken } from "@/data/automation-server";
import mqtt, { type MqttClient } from "mqtt";

interface CreateWorkspaceModalProps {
  children: React.ReactNode;
  automationServerId: string;
  onSuccess?: () => void;
}

interface WorkspaceInitMessage {
  name: string;
  remote?: string;
  branch?: string;
  domain?: string;
  "editor-image"?: string;
  "gitops-image"?: string;
  "oauth-config"?: string;
  "no-oauth"?: boolean;
  "ssh-port"?: string;
  mkcerts?: boolean;
  "set-hosts"?: boolean;
  local?: boolean;
  "no-ide"?: boolean;
}

interface LogMessage {
  command: string;
  object: string;
  output: string;
  status?: "running" | "success" | "failure";
}

export function CreateWorkspaceModal({
  children,
  automationServerId,
  onSuccess,
}: CreateWorkspaceModalProps) {
  const { isAdmin, isLoading: isAdminLoading } = useAdminStatus();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState<WorkspaceInitMessage>({
    name: "",
  });
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailure, setIsFailure] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string>("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const mqttClientRef = useRef<MqttClient | null>(null);
  const successDetectedRef = useRef(false);


  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Cleanup MQTT client on unmount
  useEffect(() => {
    return () => {
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
        mqttClientRef.current = null;
      }
    };
  }, []);

  // Only allow admin users
  if (!isAdmin && !isAdminLoading) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Workspace name is required");
      return;
    }

    setIsCreating(true);
    setLogs([]);
    setIsSuccess(false);
    setIsFailure(false);
    setFailureMessage("");
    successDetectedRef.current = false;

    try {
      // Get MQTT token for the automation server (admin only)
      const mqttConfig = await getAutomationServerMQTTToken(automationServerId);

      // Get MQTT broker URL
      const currentHost = window.location.hostname;
      const protocol = 'wss:';
      const mqttHostname = currentHost.replace(/^[^.]+\./, 'mqtt.');
      const mqttHost = `${protocol}//${mqttHostname}/mqtt`;

      console.log(`[CreateWorkspaceModal] Connecting to MQTT broker: ${mqttHost}`);
      console.log(`[CreateWorkspaceModal] Current hostname: ${currentHost}, MQTT hostname: ${mqttHostname}`);

      // Create MQTT client directly for this operation
      const clientId = "bitswan-workspace-manager-" + Math.random().toString(16).substring(2, 8);
      const mqttClient: MqttClient = mqtt.connect(mqttHost, {
        clientId,
        clean: true,
        reconnectPeriod: 0, // Disable auto-reconnect for one-time operation
        connectTimeout: 30 * 1000,
        username: "bitswan-frontend",
        password: mqttConfig.token,
      });

      mqttClientRef.current = mqttClient;

      // Wait for connection with timeout
      console.log(`[CreateWorkspaceModal] Waiting for MQTT connection to ${mqttHost}...`);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error(`[CreateWorkspaceModal] Connection timeout after 15 seconds for ${mqttHost}`);
          mqttClient.end();
          reject(new Error(`MQTT connection timeout: Failed to connect to ${mqttHost} within 15 seconds. Please check if the MQTT broker is accessible.`));
        }, 15000);

        mqttClient.on("connect", () => {
          clearTimeout(timeout);
          console.log(`[CreateWorkspaceModal] Successfully connected to MQTT broker: ${mqttHost}`);
          
          // Subscribe to logs topic
          mqttClient.subscribe("logs", { qos: 0 }, (err) => {
            if (err) {
              console.error(`[CreateWorkspaceModal] Failed to subscribe to logs topic:`, err);
            } else {
              console.log(`[CreateWorkspaceModal] Subscribed to logs topic`);
            }
          });

          resolve();
        });

        mqttClient.on("error", (err) => {
          clearTimeout(timeout);
          console.error(`[CreateWorkspaceModal] MQTT connection error to ${mqttHost}:`, err);
          mqttClient.end();
          reject(new Error(`MQTT connection error to ${mqttHost}: ${err.message}`));
        });
      });

      // Set up log message handler
      const workspaceName = formData.name;
      
      mqttClient.on("message", (topic, message) => {
        if (topic === "logs") {
          try {
            const logMsg: LogMessage = JSON.parse(message.toString());
            // Only show logs for this workspace init command
            if (logMsg.command === "workspace-init" && logMsg.object === workspaceName) {
              setLogs((prevLogs) => [...prevLogs, logMsg]);
              
              // Check for status field to determine completion
              if (logMsg.status === "success") {
                if (!successDetectedRef.current) {
                  console.log(`[CreateWorkspaceModal] Success status detected in logs`);
                  successDetectedRef.current = true;
                  setIsSuccess(true);
                  setIsCreating(false);
                  // Don't call onSuccess here - let the user see the success message
                  // onSuccess will be called when they close the modal
                  
                  // Disconnect after a short delay
                  setTimeout(() => {
                    if (mqttClientRef.current) {
                      mqttClientRef.current.end();
                      mqttClientRef.current = null;
                    }
                  }, 1000);
                }
              } else if (logMsg.status === "failure") {
                if (!successDetectedRef.current) {
                  console.error(`[CreateWorkspaceModal] Failure status detected in logs`);
                  successDetectedRef.current = true;
                  setIsCreating(false);
                  setIsFailure(true);
                  setFailureMessage(logMsg.output);
                  
                  // Disconnect after a short delay
                  setTimeout(() => {
                    if (mqttClientRef.current) {
                      mqttClientRef.current.end();
                      mqttClientRef.current = null;
                    }
                  }, 1000);
                }
              }
            }
          } catch (err) {
            console.error(`[CreateWorkspaceModal] Failed to parse log message:`, err);
          }
        }
      });

      // Prepare the message
      const message: WorkspaceInitMessage = {
        name: formData.name,
      };

      if (formData.remote) message.remote = formData.remote;
      if (formData.branch) message.branch = formData.branch;
      if (formData.domain) message.domain = formData.domain;
      if (formData["editor-image"]) message["editor-image"] = formData["editor-image"];
      if (formData["gitops-image"]) message["gitops-image"] = formData["gitops-image"];
      if (formData["oauth-config"]) message["oauth-config"] = formData["oauth-config"];
      if (formData["no-oauth"]) message["no-oauth"] = true;
      if (formData["ssh-port"]) message["ssh-port"] = formData["ssh-port"];
      if (formData.mkcerts) message.mkcerts = true;
      if (formData["set-hosts"]) message["set-hosts"] = true;
      if (formData.local) message.local = true;
      if (formData["no-ide"]) message["no-ide"] = true;

      // Publish to workspace/init topic
      console.log(`[CreateWorkspaceModal] Publishing workspace init message to topic: workspace/init`);
      mqttClient.publish("workspace/init", JSON.stringify(message), { qos: 0 }, (error) => {
        if (error) {
          console.error(`[CreateWorkspaceModal] Publish error:`, error);
          mqttClient.end();
          setIsCreating(false);
          alert(`Failed to publish message: ${error.message}`);
        } else {
          console.log(`[CreateWorkspaceModal] Successfully published to workspace/init`);
          // Don't disconnect immediately - wait for logs to complete
          // The completion will be detected by the log handler when status is "success" or "failure"
        }
      });
    } catch (error: any) {
      console.error("[CreateWorkspaceModal] Error creating workspace:", error);
      console.error("[CreateWorkspaceModal] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Show detailed error message to user
      const errorMessage = error.message || "Failed to create workspace";
      alert(`Failed to create workspace:\n\n${errorMessage}\n\nCheck the browser console for more details.`);
      setIsCreating(false);
      
      // Clean up MQTT client
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
        mqttClientRef.current = null;
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormData({ name: "" });
      setShowAdvanced(false);
      setIsCreating(false);
      setLogs([]);
      setIsSuccess(false);
      setIsFailure(false);
      setFailureMessage("");
      successDetectedRef.current = false;
      
      // Clean up MQTT client
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
        mqttClientRef.current = null;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Initialize a new workspace on this automation server.
          </DialogDescription>
        </DialogHeader>
        
        {isSuccess ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-green-50 p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Workspace created successfully!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    The workspace &quot;{formData.name}&quot; has been initialized.
                  </p>
                </div>
              </div>
            </div>
            
            {logs.length > 0 && (
              <div className="space-y-2">
                <Label>Creation Logs</Label>
                <div className="rounded-md border bg-gray-50 p-3 max-h-64 overflow-y-auto font-mono text-xs">
                  {logs.map((log, index) => (
                    <div key={index} className="text-gray-700">
                      {log.output}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}
          </div>
        ) : isFailure ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Workspace creation failed
                  </p>
                  {failureMessage && (
                    <p className="text-sm text-red-700 mt-1">
                      {failureMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {logs.length > 0 && (
              <div className="space-y-2">
                <Label>Creation Logs</Label>
                <div className="rounded-md border bg-gray-50 p-3 max-h-64 overflow-y-auto font-mono text-xs">
                  {logs.map((log, index) => (
                    <div key={index} className="text-gray-700">
                      {log.output}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name *</Label>
              <Input
                id="name"
                placeholder="my-workspace"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between"
              >
                <span>Advanced Options</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="remote">Remote Repository</Label>
                      <Input
                        id="remote"
                        placeholder="git@github.com:user/repo.git"
                        value={formData.remote || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, remote: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        placeholder="main"
                        value={formData.branch || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, branch: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      placeholder="example.com"
                      value={formData.domain || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editor-image">Editor Image</Label>
                      <Input
                        id="editor-image"
                        placeholder="bitswan/bitswan-editor:latest"
                        value={formData["editor-image"] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            "editor-image": e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gitops-image">GitOps Image</Label>
                      <Input
                        id="gitops-image"
                        placeholder="bitswan/gitops:latest"
                        value={formData["gitops-image"] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            "gitops-image": e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oauth-config">OAuth Config File</Label>
                    <Input
                      id="oauth-config"
                      placeholder="/path/to/oauth-config.yaml"
                      value={formData["oauth-config"] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          "oauth-config": e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ssh-port">SSH Port</Label>
                    <Input
                      id="ssh-port"
                      placeholder="22"
                      value={formData["ssh-port"] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, "ssh-port": e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="no-oauth"
                        checked={formData["no-oauth"] || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            "no-oauth": checked === true,
                          })
                        }
                      />
                      <Label htmlFor="no-oauth" className="cursor-pointer">
                        Disable OAuth (use password authentication)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mkcerts"
                        checked={formData.mkcerts || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            mkcerts: checked === true,
                          })
                        }
                      />
                      <Label htmlFor="mkcerts" className="cursor-pointer">
                        Generate local certificates (mkcerts)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="set-hosts"
                        checked={formData["set-hosts"] || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            "set-hosts": checked === true,
                          })
                        }
                      />
                      <Label htmlFor="set-hosts" className="cursor-pointer">
                        Automatically set hosts in /etc/hosts
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="local"
                        checked={formData.local || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            local: checked === true,
                          })
                        }
                      />
                      <Label htmlFor="local" className="cursor-pointer">
                        Local development mode (auto-enables mkcerts and set-hosts)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="no-ide"
                        checked={formData["no-ide"] || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            "no-ide": checked === true,
                          })
                        }
                      />
                      <Label htmlFor="no-ide" className="cursor-pointer">
                        Do not start Bitswan Editor
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {isCreating && logs.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <Label>Creation Logs</Label>
                <div className="rounded-md border bg-gray-50 p-3 max-h-64 overflow-y-auto font-mono text-xs">
                  {logs.map((log, index) => (
                    <div key={index} className="text-gray-700">
                      {log.output}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {isSuccess || isFailure ? (
              <Button
                type="button"
                onClick={() => {
                  // Call onSuccess when closing after success (to refresh data)
                  if (isSuccess) {
                    onSuccess?.();
                  }
                  setOpen(false);
                  setFormData({ name: "" });
                  setShowAdvanced(false);
                  setLogs([]);
                  setIsSuccess(false);
                  setIsFailure(false);
                  setFailureMessage("");
                }}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || !formData.name.trim()}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Workspace
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

