import { useState } from "react";
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <EllipsisIcon size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    MQTTService.getInstance().deleteProcess(
                      row.original.id,
                      row.original.workspace_id,
                      row.original.automation_server_id
                    );
                    toast.success("Process deleted successfully");
                  }}
                >
                  Delete process
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: processes,
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
            const processAutomations = process.automation_sources.map(
              (deploymentId) =>
                automations.find(
                  (auto) => auto.properties["deployment-id"] === deploymentId
                )
            );

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
    </div>
  );
}
