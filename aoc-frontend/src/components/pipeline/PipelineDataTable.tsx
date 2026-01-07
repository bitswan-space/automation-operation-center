import {
    ArrowDownNarrowWide,
    ArrowDownUp,
    ArrowDownWideNarrow,
    Check,
    Code,
    ExternalLink,
    Filter,
    Loader2, Search
} from "lucide-react";
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
  type Row,
  type Table as TableT
} from "@tanstack/react-table";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table,
} from "../ui/table";

import { Button } from "../ui/button";
import { Checkbox } from "@radix-ui/react-checkbox";
import { Input } from "../ui/input";
import React from "react";
import { Badge } from "../ui/badge";
import { type PipelineStat, type PipelineWithStats } from "@/types";

import { Area, AreaChart, XAxis } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const columnHelper = createColumnHelper<PipelineWithStats>();

export const columns = [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("properties.name", {
    header: "Automation name",
    cell: ({ row }) => {
      const { properties } = row.original;
      return <div className="text-xs">{properties.name}</div>;
    },
  }),
    columnHelper.display({
    id: "process",
    header: "Process",
    cell: () => {
      // TODO: Implement process column
      return <div className="text-xs">—</div>;
    },
  }),
  columnHelper.accessor("properties.automation-url", {
    header: "URL",
    cell: ({row}) => {
      const url = row.original.properties["automation-url"];
      if (!url) {
        return <div className="text-xs">—</div>;
      }
      return (
        <div className="text-xs">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      );
    }
  }),
    columnHelper.accessor("properties.endpoint-name", {
        header: "Workspace",
        cell: ({ row }) => {
            const machineName = row.original.properties["endpoint-name"];
            return <div className="text-xs">{machineName}</div>;
        },
        filterFn: (
            row: Row<PipelineWithStats>,
            columnId: string,
            filterValue: string[]
        ) => {
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(row.getValue(columnId));
        },
    }),
  columnHelper.accessor("automationServerName", {
    header: "Server",
    cell: ({ row }) => {
      return <div className="text-xs">{row.original.automationServerName}</div>;
    },
    filterFn: (
      row: Row<PipelineWithStats>,
      columnId: string,
      filterValue: string[]
    ) => {
      if (!filterValue || filterValue.length === 0) return true;
      return filterValue.includes(row.getValue(columnId));
    },
  }),
    columnHelper.accessor("properties.created-at", {
        header: "Created",
        cell: ({ row }) => {
            const date = new Date(row.original.properties["created-at"]);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = monthNames[date.getMonth()];
            const day = date.getDate();
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const createdAt = `${month} ${day}, ${year}; ${hours}:${minutes}`;

            return <div className="text-xs">{createdAt}</div>;
        },
    }),

    columnHelper.accessor("properties.status", {
        header: "Uptime",
        cell: ({ row }) => {
            const uptime = row.original.properties.status;

            return <div className="text-xs capitalize">{uptime}</div>;
        },
    }),

  columnHelper.accessor("properties.state", {
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.properties.state;

      const getStatusBadge = (status: string) => {
        switch (status) {
          case "running":
            return <Badge className="bg-green-100 text-green-600 shadow-none">Running</Badge>;
          case "stopped":
            return <Badge className="bg-red-100 text-red-600 shadow-none">Stopped</Badge>;
          default:
            return (
              <Badge className="bg-yellow-100 text-yellow-600 shadow-none">{status}</Badge>
            );
        }
      };

      return <div className="text-xs capitalize">{getStatusBadge(status)}</div>;
    },
    filterFn: (
      row: Row<PipelineWithStats>,
      columnId: string,
      filterValue: string[]
    ) => {
      if (!filterValue || filterValue.length === 0) return true;
      return filterValue.includes(row.getValue(columnId));
    },
  }),

    // COMMENTED OUT UNTIL AOC MONITOR IS SET UP

    // columnHelper.display({
    //   id: "pipelineStatEpsIn",
    //   header: "eps.in",
    //   cell: ({ row }) => {
    //     const epsInStat = row.original.pipelineStat?.filter(
    //       (stat) => stat._field === "eps.in",
    //     );
    //     const latestEpsIn = epsInStat?.[epsInStat.length - 1]?._value;
    //     return (
    //       <div className="text-start">
    //         <EpsTinyLineChart data={row.original.pipelineStat} type="in" />
    //         <div className="text-xs font-semibold">: {latestEpsIn}</div>
    //       </div>
    //     );
    //   },
    // }),
    // columnHelper.display({
    //   id: "pipelineStatEpsOut",
    //   header: "eps.out",
    //   cell: ({ row }) => {
    //     const epsOutStat = row.original.pipelineStat?.filter(
    //       (stat) => stat._field === "eps.out",
    //     );
    //     const latestEpsOut = epsOutStat?.[epsOutStat.length - 1]?._value;
    //     return (
    //       <div>
    //         <EpsTinyLineChart data={row.original.pipelineStat} type="out" />
    //         <div className="text-xs font-semibold" title="Latest value">
    //           : {latestEpsOut}
    //         </div>
    //       </div>
    //     );
    //   },
    // }),

  columnHelper.display({
    id: "edit",
    header: "Edit",
    enableHiding: false,
    cell: ({ row }) => {
      const vscodeLink = row.original.vscodeLink;
      if (!vscodeLink) {
        return <div className="text-xs text-gray-400">—</div>;
      }
      return (
        <Button
          size="sm"
          asChild
        >
          <a
            href={vscodeLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Editor"
          >
            <Code className="h-4 w-4" />
            Edit
          </a>
        </Button>
      );
    },
  }),
];

type PipelineDataTableProps = {
  pipelines: PipelineWithStats[];
  isLoading: boolean;
};

export function PipelineDataTable(props: PipelineDataTableProps) {
  const { isLoading } = props;
  const data = React.useMemo(() => props.pipelines, [props.pipelines]);

  // Get unique workspace IDs for the filter dropdown
  const workspaceIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          data.map((row) => row.properties["endpoint-name"]).filter(Boolean)
        )
      ),
    [data]
  );

  // Get unique automation server names for the filter dropdown
  const automationServerNames = React.useMemo(
    () =>
      Array.from(
        new Set(
          data.map((row) => row.automationServerName).filter(Boolean)
        )
      ),
    [data]
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const isSortable = [
    "properties_name", 
    "automationServerName", 
    "properties_endpoint-name", 
    "properties_created-at", 
    "properties_status",
    "properties_state"
  ]

  return (
    <div className="w-full">
      <div className="relative flex items-center pb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
              placeholder="Search automations..."
              value={
                (table.getColumn("properties_name")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) => {
                table
                  .getColumn("properties_name")
                  ?.setFilterValue(event.target.value);
              }}
              className="max-w-sm pl-8"
          />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-stone-100/70">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold text-sm">
                      {header.isPlaceholder
                        ? null
                        : (
                            <span className="inline-flex items-center gap-0.5">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {isSortable.includes(header.id) ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={header.column.getToggleSortingHandler()}
                                  className="focus:outline-none p-0 h-6 w-6"
                                >
                                  {header.column.getIsSorted() === "asc" ? (
                                    <ArrowDownNarrowWide size={16} />
                                  ) : header.column.getIsSorted() === "desc" ? (
                                    <ArrowDownWideNarrow size={16} />
                                  ) : (
                                    <ArrowDownUp size={16} />
                                  )}
                                </Button>
                              ) : null}

                              {header.id === "automationServerName" ? (
                                <SelectFilter header_id={header.id} options={automationServerNames} table={table} />
                              ) : null}

                              {header.id === "properties_endpoint-name" ? (
                                <SelectFilter header_id={header.id} options={workspaceIds} table={table} />
                              ) : null}

                              {header.id === "properties_state" ? (
                                <SelectFilter 
                                  header_id={header.id} 
                                  options={["running", "stopped", "restarting"]} 
                                  table={table} />
                              ) : null}
                            </span>
                          )
                      }
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length || isLoading ? (
              <>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="rounded font-mono"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-16 text-center text-slate-500"
                    >
                      <div className="flex justify-center items-center w-full h-full">
                        <Loader2 size={16} className="animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-gray-500 text-lg mb-2">
                      There are no Automations from any workspaces to display
                    </div>
                    <div className="text-gray-400 text-sm">
                      Connect to a workspace to see your automations here
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EpsTinyLineChartProps {
  data: PipelineStat[];
  type: "in" | "out";
}

export const EpsTinyLineChart = (props: EpsTinyLineChartProps) => {
  const { data, type } = props;

  const getDataKey = (type: "in" | "out") => {
    switch (type) {
      case "in":
        return "eps.in";
      case "out":
        return "eps.out";
    }
  };

  const processedData = (data: PipelineStat[], dataKey: string) => {
    return data
      .map((stat) => {
        return {
          time: stat._time,
          [stat._field]: stat._value,
        };
      })
      .filter((stat) => stat[dataKey]);
  };

  return (
    <AreaChart
      width={100}
      height={50}
      data={processedData(data, getDataKey(type))}
      margin={{
        top: 2,
        right: 5,
        left: 0,
        bottom: 2,
      }}
      className="flex justify-start text-left"
    >
      <defs>
        <linearGradient id="colorEps" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.8} />
          <stop offset="90%" stopColor="#1d4ed8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="time" hide />
      <Area
        type="monotone"
        dataKey={getDataKey(type)}
        stroke="#1d4ed8"
        fill="url(#colorEps)"
        fillOpacity={0.6}
      />
    </AreaChart>
  );
};

interface SelectFilterProps {
  options: string[];
  table: TableT<PipelineWithStats>;
  header_id: string;
}

const SelectFilter = (props: SelectFilterProps) => {
  const { options, table, header_id } = props;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="p-0 h-6 w-6">
          <Filter size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="flex flex-col gap-1">
          {options.map((option) => {
            const current =
              (table.getColumn(header_id)?.getFilterValue() as string[]) ?? [];
            const selected = current.includes(option);
            return (
              <Button
                key={option}
                variant={selected ? "secondary" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  if (selected) {
                    table.getColumn(header_id)?.setFilterValue(
                      current.filter((id: string) => id !== option)
                    );
                  } else {
                    table.getColumn(header_id)?.setFilterValue([...current, option]);
                  }
                }}
              >
                <span className="inline-flex items-center justify-between w-full">
                  <p className="text-left">{option}</p>
                  {selected ? <Check /> : null}
                </span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}