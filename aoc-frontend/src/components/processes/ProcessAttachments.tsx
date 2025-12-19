import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Paperclip, Download, Upload, Trash2, Loader2 } from "lucide-react";
import MQTTService from "@/services/MQTTService";
import { toast } from "sonner";
import { useAutomations } from "@/context/AutomationsProvider";

interface ProcessAttachmentsProps {
  processId: string;
  workspaceId: string;
  automationServerId: string;
}

export default function ProcessAttachments({
  processId,
  workspaceId,
  automationServerId,
}: ProcessAttachmentsProps) {
  const { processes } = useAutomations();
  const process = processes[processId];
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);

  // Load attachments from process object
  useEffect(() => {
    if (process?.attachments) {
      setAttachments(process.attachments);
    } else {
      setAttachments([]);
    }
  }, [process?.attachments]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const success = MQTTService.getInstance().setProcessAttachment(
        processId,
        selectedFile.name,
        selectedFile,
        workspaceId,
        automationServerId
      );

      if (success) {
        toast.success("Attachment uploaded successfully");
        setUploadDialogOpen(false);
        setSelectedFile(null);
        // Refresh attachments list - it will be updated via MQTT subscription
      } else {
        toast.error("Failed to upload attachment");
      }
    } catch (error) {
      console.error("Error uploading attachment:", error);
      toast.error("Failed to upload attachment");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (!attachmentToDelete) return;

    const success = MQTTService.getInstance().deleteProcessAttachment(
      processId,
      attachmentToDelete,
      workspaceId,
      automationServerId
    );

    if (success) {
      toast.success("Attachment deleted successfully");
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
      // Refresh attachments list - it will be updated via MQTT subscription
    } else {
      toast.error("Failed to delete attachment");
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const blob = await MQTTService.getInstance().getProcessAttachment(
        processId,
        fileName,
        workspaceId,
        automationServerId
      );

      if (blob) {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Attachment downloaded successfully");
      } else {
        toast.error("Failed to download attachment");
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download attachment");
    }
  };

  return (
    <>
      <div className="border-t p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Paperclip size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium">Attachments</span>
            {attachments.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {attachments.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload size={14} className="mr-1" />
            Upload
          </Button>
        </div>
        {attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {attachments.map((fileName, index) => (
              <Badge key={index} variant="outline" className="text-xs group">
                <span className="mr-1">{fileName}</span>
                <Download
                  size={12}
                  className="text-blue-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                  onClick={() => handleDownload(fileName)}
                />
                <Trash2
                  size={12}
                  className="text-destructive cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setAttachmentToDelete(fileName);
                    setDeleteDialogOpen(true);
                  }}
                />
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No attachments</p>
        )}
      </div>

      {/* Upload Attachment Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Attachment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="attachment-file" className="text-sm font-medium">
                Select File
              </label>
              <Input
                id="attachment-file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
                className="mt-2"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading && <Loader2 size={14} className="mr-2 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Attachment Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the attachment "{attachmentToDelete}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

