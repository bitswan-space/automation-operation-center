import React, { useState, useMemo } from "react";
import { createColumnHelper, flexRender } from "@tanstack/react-table";
import { type PipelineWithStats, type Process, type WorkspaceGroup } from "@/types";
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
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import MQTTService from "@/services/MQTTService";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { useAutomations } from "@/context/AutomationsProvider";

const columnHelper = createColumnHelper<Process>();

type ProcessesTableProps = {
  processes: Process[];
  automations: PipelineWithStats[];
  hideWorkspaceColumn?: boolean;
  hideOther?: boolean;
};

export default function ProcessesTable(props: ProcessesTableProps) {
  const { processes, automations, hideWorkspaceColumn, hideOther } = props;
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(
    new Set()
  );
  const [processToDelete, setProcessToDelete] = useState<Process | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { automationServers } = useAutomations();
  const workspaces = Object.values(automationServers).reduce((acc, server) => {
    return { ...acc, ...server.workspaces };
  }, {} as Record<string, WorkspaceGroup>);

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
        !referencedDeploymentIds.has(automation.properties["deployment-id"])
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
                  {workspaces[row.original.workspace_id]?.workspace.name ?? row.original.workspace_id}
                </div>
              );
            },
          }),
        ]),
    columnHelper.display({
      id: "automations",
      header: "Automations",
      cell: ({ row }) => {
        return (
          <div className="font-bold">
            {row.original.automation_sources.length}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "running",
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
    columnHelper.display({
      id: "failed",
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
    data: hideOther ? processes : processesWithOther,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
    },
  });
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search processes..."
            className="border-gray-300 bg-white pl-8"
            value={
              (table.getColumn("name")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) => {
              table.getColumn("name")?.setFilterValue(event.target.value);
            }}
          />
        </div>
      </div>
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
                    (auto) => auto.properties["deployment-id"] === deploymentId && auto.workspaceId === process.workspace_id
                  )
                )
                .filter(
                  (auto): auto is PipelineWithStats => auto !== undefined
                );
              return (
                <React.Fragment key={row.id}>
                  <TableRow className="h-16 hover:bg-transparent">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="p-0"
                      >
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="px-4 font-semibold">Name</TableHead>
                              <TableHead className="px-4 font-semibold">Created</TableHead>
                              <TableHead className="px-4 font-semibold">Status</TableHead>
                              <TableHead className="px-4 font-semibold">State</TableHead>
                              <TableHead className="px-4 font-semibold text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {processAutomations.map((automation, index) => (
                              <TableRow
                                key={`${process.id}-automation-${index}`}
                                className="h-16 bg-primary-foreground"
                              >
                                <TableCell className="px-4 font-bold">
                                  {automation.properties.name}
                                </TableCell>
                                <TableCell className="px-4">
                                  {format(
                                    new Date(automation.properties["created-at"]),
                                    "MMM d, yyyy; HH:mm"
                                  )}
                                </TableCell>
                                <TableCell className="px-4">
                                  {automation.properties.status}
                                </TableCell>
                                <TableCell className="px-4">
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
                                </TableCell>
                                <TableCell className="px-4 text-right">
                                  <Link to={automation.vscodeLink} target="_blank">
                                    <Button>
                                      <CodeIcon size={16} /> Edit
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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
                <strong>&quot;{processToDelete?.name}&quot;</strong>? This
                action cannot be undone.
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
    </>
  );
}
