import { ChevronDownIcon, ChevronRight } from "lucide-react";
import {
  type ColumnDef,
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

import { ResponsiveContainer, Area, AreaChart, XAxis } from "recharts";
import Link from "next/link";
import { parseDateTimeStringToPandaFormat } from "@/utils/time";

export const columns: ColumnDef<PipelineWithStats>[] = [
  {
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
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const { name, id } = row.original;
      const correctedName = name.startsWith("/") ? name.slice(1) : name;

      return (
        <Link href={`/pipelines/${id}`} className="text-blue-700 underline">
          {correctedName}
        </Link>
      );
    },
  },
  {
    accessorKey: "machineName",
    header: "Machine Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("machineName")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      const getStatusBadge = (status: string) => {
        switch (status) {
          case "running":
            return <Badge className="bg-green-600 shadow-none">Running</Badge>;
          case "stopped":
            return <Badge className="bg-red-600 shadow-none">Stopped</Badge>;
        }
      };

      return <div className="capitalize">{getStatusBadge(status)}</div>;
    },
  },
  {
    accessorKey: "dateCreated",
    header: "Date Created",
    cell: ({ row }) => (
      <div className="capitalize">
        {parseDateTimeStringToPandaFormat(row.getValue("dateCreated"))}
      </div>
    ),
  },
  {
    header: "eps.in",
    cell: ({ row }) => {
      return (
        <div className="text-start">
          <EpsTinyLineChart data={row.original.pipelineStat} type="in" />
        </div>
      );
    },
  },
  {
    header: "eps.out",
    cell: ({ row }) => {
      return (
        <div className="flex justify-start">
          <EpsTinyLineChart data={row.original.pipelineStat} type="out" />
        </div>
      );
    },
  },
  {
    accessorKey: "upTime",
    header: "Uptime",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("upTime")}</div>
    ),
  },
  {
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
  },
];

type PipelineDataTableProps = {
  pipelines: PipelineWithStats[];
};

export function PipelineDataTable(props: PipelineDataTableProps) {
  const data = React.useMemo(() => props.pipelines, [props.pipelines]);

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

  return (
    <div className="w-full">
      <div className="flex items-center pb-4">
        <Input
          placeholder="Find pipelines..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
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
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
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
              ))
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

  const processedData = (data: PipelineStat[]) => {
    return data.map((stat) => {
      return {
        time: stat._time,
        [stat._field]: stat._value,
      };
    });
  };

  return (
    <ResponsiveContainer width={100} height={50}>
      <AreaChart
        data={processedData(data)}
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
    </ResponsiveContainer>
  );
};
