import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, Copy, Check } from "lucide-react";

interface EmailSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  temporaryPassword: string;
}

export function EmailSetupDialog({ open, onOpenChange, email, temporaryPassword }: EmailSetupDialogProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleCopyCredentials = async () => {
    const credentials = `Email: ${email}\nPassword: ${temporaryPassword}`;
    try {
      await navigator.clipboard.writeText(credentials);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy credentials:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            User Invited - Manual Password Required
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <p>
              The user <strong>{email}</strong> has been successfully added to your organization, 
              but the email server is not configured to send login credentials.
            </p>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Login Credentials:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800">Email:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{email}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-800">Password:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono">
                      {temporaryPassword}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPassword}
                      className="h-6 w-6 p-0"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-md border border-amber-200">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Share these credentials securely with the user</li>
                    <li>• The user should change their password on first login</li>
                    <li>• Contact your system administrator to set up email configuration</li>
                  </ul>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCopyCredentials}>
            <Copy className="h-4 w-4 mr-2" />
            Copy All Credentials
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
