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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Trash2, CheckCircle, XCircle } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { getAutomationServerMQTTToken } from "@/data/automation-server";
import mqtt, { type MqttClient } from "mqtt";

interface DeleteWorkspaceModalProps {
  children: React.ReactNode;
  workspaceName: string;
  workspaceId: string;
  automationServerId: string;
  onDelete?: () => void;
}

interface WorkspaceRemoveMessage {
  name: string;
}

interface LogMessage {
  command: string;
  object: string;
  output: string;
  status?: "running" | "success" | "failure";
}

export function DeleteWorkspaceModal({
  children,
  workspaceName,
  workspaceId,
  automationServerId,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const { isAdmin, isLoading: isAdminLoading } = useAdminStatus();
  const [confirmationName, setConfirmationName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
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

  const isNameValid = confirmationName === workspaceName;

  const handleDelete = async () => {
    if (!isNameValid) return;

    setIsDeleting(true);
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

      console.log(`[DeleteWorkspaceModal] Connecting to MQTT broker: ${mqttHost}`);
      console.log(`[DeleteWorkspaceModal] Current hostname: ${currentHost}, MQTT hostname: ${mqttHostname}`);

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
      console.log(`[DeleteWorkspaceModal] Waiting for MQTT connection to ${mqttHost}...`);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error(`[DeleteWorkspaceModal] Connection timeout after 15 seconds for ${mqttHost}`);
          mqttClient.end();
          reject(new Error(`MQTT connection timeout: Failed to connect to ${mqttHost} within 15 seconds. Please check if the MQTT broker is accessible.`));
        }, 15000);

        mqttClient.on("connect", () => {
          clearTimeout(timeout);
          console.log(`[DeleteWorkspaceModal] Successfully connected to MQTT broker: ${mqttHost}`);
          
          // Subscribe to logs topic
          mqttClient.subscribe("logs", { qos: 0 }, (err) => {
            if (err) {
              console.error(`[DeleteWorkspaceModal] Failed to subscribe to logs topic:`, err);
            } else {
              console.log(`[DeleteWorkspaceModal] Subscribed to logs topic`);
            }
          });

          resolve();
        });

        mqttClient.on("error", (err) => {
          clearTimeout(timeout);
          console.error(`[DeleteWorkspaceModal] MQTT connection error to ${mqttHost}:`, err);
          mqttClient.end();
          reject(new Error(`MQTT connection error to ${mqttHost}: ${err.message}`));
        });
      });

      // Set up log message handler
      mqttClient.on("message", (topic, message) => {
        if (topic === "logs") {
          try {
            const logMsg: LogMessage = JSON.parse(message.toString());
            // Only show logs for this workspace remove command
            if (logMsg.command === "workspace-remove" && logMsg.object === workspaceName) {
              setLogs((prevLogs) => [...prevLogs, logMsg]);
              
              // Check for status field to determine completion
              if (logMsg.status === "success") {
                if (!successDetectedRef.current) {
                  console.log(`[DeleteWorkspaceModal] Success status detected in logs`);
                  successDetectedRef.current = true;
                  setIsSuccess(true);
                  setIsDeleting(false);
                  
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
                  console.error(`[DeleteWorkspaceModal] Failure status detected in logs`);
                  successDetectedRef.current = true;
                  setIsDeleting(false);
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
            console.error(`[DeleteWorkspaceModal] Failed to parse log message:`, err);
          }
        }
      });

      // Prepare the message
      const message: WorkspaceRemoveMessage = {
        name: workspaceName,
      };

      // Publish to workspace/remove topic
      console.log(`[DeleteWorkspaceModal] Publishing workspace remove message to topic: workspace/remove`);
      mqttClient.publish("workspace/remove", JSON.stringify(message), { qos: 0 }, (error) => {
        if (error) {
          console.error(`[DeleteWorkspaceModal] Publish error:`, error);
          mqttClient.end();
          setIsDeleting(false);
          setIsFailure(true);
          setFailureMessage(`Failed to publish message: ${error.message}`);
          
          // Clean up MQTT client
          if (mqttClientRef.current) {
            mqttClientRef.current.end();
            mqttClientRef.current = null;
          }
        } else {
          console.log(`[DeleteWorkspaceModal] Successfully published to workspace/remove`);
          // Don't disconnect immediately - wait for logs to complete
          // The completion will be detected by the log handler when status is "success" or "failure"
        }
      });
    } catch (error: any) {
      console.error("[DeleteWorkspaceModal] Error deleting workspace:", error);
      console.error("[DeleteWorkspaceModal] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Show error in the UI instead of alert
      const errorMessage = error.message || "Failed to delete workspace";
      setIsDeleting(false);
      setIsFailure(true);
      setFailureMessage(errorMessage);
      
      // Clean up MQTT client
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
        mqttClientRef.current = null;
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing the dialog while deletion is in progress
    if (!newOpen && isDeleting) {
      // Don't allow closing while deletion is in progress
      return;
    }
    
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmationName("");
      setIsDeleting(false);
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
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Workspace
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the workspace{" "}
            <strong>&quot;{workspaceName}&quot;</strong> and all its associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {isSuccess ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-green-50 p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Workspace deleted successfully!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    The workspace &quot;{workspaceName}&quot; has been removed.
                  </p>
                </div>
              </div>
            </div>
            
            {logs.length > 0 && (
              <div className="space-y-2">
                <Label>Deletion Logs</Label>
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
                    Workspace deletion failed
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
                <Label>Deletion Logs</Label>
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
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="confirmation-name" className="text-sm font-medium">
                To confirm deletion, type the workspace name: <strong>&quot;{workspaceName}&quot;</strong>
              </label>
              <Input
                id="confirmation-name"
                placeholder={workspaceName}
                value={confirmationName}
                onChange={(e) => setConfirmationName(e.target.value)}
                className={confirmationName && !isNameValid ? "border-red-500" : ""}
              />
              {confirmationName && !isNameValid && (
                <p className="text-sm text-red-600">
                  Workspace name does not match. Please enter the exact name.
                </p>
              )}
            </div>

            {isDeleting && logs.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <Label>Deletion Logs</Label>
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
        )}
        
        <AlertDialogFooter>
          {isSuccess || isFailure ? (
            <AlertDialogAction
              onClick={() => {
                // Call onDelete when closing after success (to refresh data)
                if (isSuccess) {
                  onDelete?.();
                }
                setOpen(false);
                setConfirmationName("");
                setLogs([]);
                setIsSuccess(false);
                setIsFailure(false);
                setFailureMessage("");
              }}
              className={isSuccess ? "bg-green-600 hover:bg-green-700 focus:ring-green-600" : "bg-red-600 hover:bg-red-700 focus:ring-red-600"}
            >
              Close
            </AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <Button
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
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Workspace
                  </>
                )}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

