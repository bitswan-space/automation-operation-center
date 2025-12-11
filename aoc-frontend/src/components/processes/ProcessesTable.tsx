import { useState, useMemo } from "react";
import { createColumnHelper, flexRender } from "@tanstack/react-table";
import { type PipelineWithStats, type Process } from "@/types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CodeIcon,
  EllipsisIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import MQTTService from "@/services/MQTTService";
import { toast } from "sonner";

const columnHelper = createColumnHelper<Process>();

type ProcessesTableProps = {
  processes: Process[];
  automations: PipelineWithStats[];
  hideWorkspaceColumn?: boolean;
};

export default function ProcessesTable(props: ProcessesTableProps) {
  const { processes, automations, hideWorkspaceColumn } = props;
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(
    new Set()
  );
  const [processToDelete, setProcessToDelete] = useState<Process | null>(null);

  const toggleProcess = (processId: string) => {
    setExpandedProcesses((prev) => {
      const next = new Set(prev);
      if (next.has(processId)) {
        next.delete(processId);
      } else {
        next.add(processId);
      }
      return next;
    });
  };

  const handleDeleteProcess = () => {
    if (!processToDelete) return;

    MQTTService.getInstance().deleteProcess(
      processToDelete.id,
      processToDelete.workspace_id,
      processToDelete.automation_server_id
    );
    toast.success("Process deleted successfully");
    setProcessToDelete(null);
  };

  // Create "Other" pseudo-process for automations not belonging to any process
  const processesWithOther = useMemo(() => {
    // Safety check: ensure processes and automations are defined
    if (!processes || !automations) {
      return processes || [];
    }

    // Collect all deployment IDs that are referenced by processes
    const referencedDeploymentIds = new Set<string>();
    processes.forEach((process) => {
      if (process.automation_sources) {
        process.automation_sources.forEach((deploymentId) => {
          referencedDeploymentIds.add(deploymentId);
        });
      }
    });

    // Find automations that are not referenced by any process
    const orphanedAutomations = automations.filter(
      (automation) =>
        automation?.properties?.["deployment-id"] &&
        !referencedDeploymentIds.has(
          automation.properties["deployment-id"]
        )
    );

    // If there are orphaned automations, create an "Other" pseudo-process
    if (orphanedAutomations.length > 0) {
      const otherProcess: Process = {
        id: "__other__",
        name: "Other",
        automation_server_id: orphanedAutomations[0]?.automationServerId ?? "",
        workspace_id: orphanedAutomations[0]?.workspaceId ?? "",
        attachments: [],
        automation_sources: orphanedAutomations
          .map((auto) => auto.properties["deployment-id"])
          .filter((id): id is string => id !== undefined),
      };
      return [...processes, otherProcess];
    }

    return processes;
  }, [processes, automations]);

  const columns = [
    columnHelper.accessor("name", {
      header: "Process",
      cell: ({ row }) => {
        return <div className="text-sm font-bold">{row.original.name}</div>;
      },
    }),
    ...(hideWorkspaceColumn
      ? []
      : [
          columnHelper.accessor("workspace_id", {
            header: "Workspace",
            cell: ({ row }) => {
              return (
                <div>
                  {automations.find(
                    (automation) =>
                      automation.workspaceId === row.original.workspace_id
                  )?.workspaceName ?? row.original.workspace_id}
                </div>
              );
            },
          }),
        ]),
    columnHelper.accessor("automation_sources", {
      header: "Automations",
      cell: ({ row }) => {
        return (
          <div className="font-bold">
            {row.original.automation_sources.length}
          </div>
        );
      },
    }),
    columnHelper.accessor("automation_sources", {
      header: "Running",
      cell: ({ row }) => {
        const runningAutomations = row.original.automation_sources.filter(
          (source) =>
            automations.find(
              (automation) => automation.properties["deployment-id"] === source
            )?.properties.state === "running"
        );
        return (
          <div className="text-green-600 font-bold">
            {runningAutomations.length}
          </div>
        );
      },
    }),
    columnHelper.accessor("automation_sources", {
      header: "Failed",
      cell: ({ row }) => {
        const failedAutomations = row.original.automation_sources.filter(
          (source) =>
            automations.find(
              (automation) => automation.properties["deployment-id"] === source
            )?.properties.state !== "running"
        );
        return (
          <div className="text-red-600 font-bold">
            {failedAutomations.length}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => {
        const isExpanded = expandedProcesses.has(row.original.id);
        const hasAutomations = row.original.automation_sources.length > 0;
        return (
          <div className="flex gap-2 justify-end">
            {hasAutomations && (
              <Button
                variant="outline"
                className="w-40 text-xs font-bold"
                onClick={() => toggleProcess(row.original.id)}
              >
                {isExpanded ? "Hide automations" : "Show automations"}{" "}
                {isExpanded ? (
                  <ChevronUpIcon size={16} />
                ) : (
                  <ChevronDownIcon size={16} />
                )}
              </Button>
            )}
            {row.original.id !== "__other__" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <EllipsisIcon size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setProcessToDelete(row.original);
                    }}
                  >
                    Delete process
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: processesWithOther,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader className="text-muted-foreground text-sm h-12">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="px-4">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const process = row.original;
            const isExpanded = expandedProcesses.has(process.id);
            const processAutomations = process.automation_sources
              .map((deploymentId) =>
                automations.find(
                  (auto) => auto.properties["deployment-id"] === deploymentId
                )
              )
              .filter((auto): auto is PipelineWithStats => auto !== undefined);

            return (
              <>
                <TableRow key={row.id} className="h-16 hover:bg-transparent">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {isExpanded &&
                  processAutomations.map((automation, index) => (
                    <TableRow
                      key={`${process.id}-automation-${index}`}
                      className="h-16 bg-primary-foreground"
                    >
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="px-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold">
                            {automation.properties.name}
                          </div>
                          <div>
                            {format(
                              new Date(automation.properties["created-at"]),
                              "MMM d, yyyy; HH:mm"
                            )}
                          </div>
                          <div>{automation.properties.status}</div>
                          <Badge
                            className={cn(
                              "shadow-none capitalize",
                              automation.properties.state === "running"
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : "bg-red-100 text-red-700 hover:bg-red-100"
                            )}
                          >
                            {automation.properties.state}
                          </Badge>
                          <Link to={automation.vscodeLink} target="_blank">
                            <Button>
                              <CodeIcon size={16} /> Edit
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={processToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setProcessToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Process</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the process{" "}
              <strong>&quot;{processToDelete?.name}&quot;</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProcess}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
