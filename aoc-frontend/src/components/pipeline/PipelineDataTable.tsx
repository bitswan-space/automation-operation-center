import { 
  ArrowDownNarrowWide, 
  ArrowDownUp, 
  ArrowDownWideNarrow, 
  Check, 
  ChevronDownIcon, 
  ChevronRight, 
  ExternalLink, 
  FileCog, 
  Filter,
  Loader2
} from "lucide-react";
import {
  type ColumnFiltersState,
  type ExpandedState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
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
import { Link } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

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
    header: "Name",
    cell: ({ row }) => {
      const { properties } = row.original;

      return (
        <Link
          to={`/automation-servers/${row.original.automationServerId}/workspaces/${row.original.workspaceId}/automations/${row.original.properties["deployment-id"]}`}
          className="text-xs text-blue-700 underline"
        >
          {properties.name}
        </Link>
      );
    },
  }),
  columnHelper.accessor("properties.automation-url", {
    header: "URL",
    cell: ({row}) => {
      return (
        row.original.properties["automation-url"] &&
        <a
          href={row.original.properties["automation-url"]}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={18} />
        </a>
      )
    }
  }),
  columnHelper.accessor("automationServerName", {
    header: "Automation Server",
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
  columnHelper.accessor("properties.endpoint-name", {
    header: "Workspace Name",
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
  columnHelper.accessor("properties.state", {
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.properties.state;

      const getStatusBadge = (status: string) => {
        switch (status) {
          case "running":
            return <Badge className="bg-green-600 shadow-none">Running</Badge>;
          case "stopped":
            return <Badge className="bg-red-600 shadow-none">Stopped</Badge>;
          default:
            return (
              <Badge className="bg-yellow-600 shadow-none">{status}</Badge>
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
  columnHelper.accessor("properties.created-at", {
    header: "Date Created",
    cell: ({ row }) => {
      const createdAt = new Date(row.original.properties["created-at"])
        .toISOString()
        .slice(0, 16)
        .replace("T", ", ");

      return <div className="text-xs capitalize">{createdAt}</div>;
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
  
  columnHelper.accessor("properties.status", {
    header: "Uptime",
    cell: ({ row }) => {
      const uptime = row.original.properties.status;

      return <div className="text-xs capitalize">{uptime}</div>;
    },
  }),
  columnHelper.display({
    id: "launchPipelineEditor",
    cell: ({ row }) => {
      return (
        <Link
          to={`/automations/launch-automation-editor/${row.original._key}`}
          title="Launch automation editor"
          className="hidden"
        >
          <Button variant={"outline"}>
            <FileCog size={20} />
          </Button>
        </Link>
      );
    },
  }),
  columnHelper.display({
    id: "expand",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <div>
          <Button onClick={() => row.toggleExpanded()} variant={"ghost"}>
            {row.getIsExpanded() ? (
              <ChevronDownIcon size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </Button>
        </div>
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
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
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
      <div className="flex items-center pb-4">
        <Input
          placeholder="Find automations..."
          value={
            (table.getColumn("properties_name")?.getFilterValue() as string) ??
            ""
          }
          onChange={(event) => {
            table
              .getColumn("properties_name")
              ?.setFilterValue(event.target.value);
          }}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-stone-100/70">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold">
                      {header.isPlaceholder
                        ? null
                        : (
                            <span className="inline-flex items-center gap-2">
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
                  <React.Fragment key={`dt_fragment_${row.id}`}>
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
                    {row.getIsExpanded() && (
                      <TableRow
                        className="bg-blue-100/20 hover:bg-blue-50/50"
                        key={`expandable-${row.id}`}
                      >
                        <TableCell colSpan={columns.length}>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell
                                  colSpan={columns.length}
                                  className="h-24 text-center"
                                >
                                  No displayable data.
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
                  className="h-24 text-center text-slate-500"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
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