"use client";

import * as React from "react";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { PenLine, Trash2 } from "lucide-react";
import { CreateGroupFormSheet } from "./CreateGroupFormSheet";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

const data: Group[] = [
  {
    id: "1",
    name: "Management",
    color: "#1d4ed8",
    broker: "test-broker",
  },
  {
    id: "2",
    name: "HR",
    color: "#d97706",
    broker: "test-broker",
  },
  {
    id: "3",
    name: "Support",
    color: "#15803d",
    broker: "test-broker",
  },
  {
    id: "4",
    name: "Admin",
    color: "#6d28d9",
    broker: "test-broker",
  },
];

type Group = {
  id: string;
  name: string;
  color: string;
  broker: string;
};

const columnHelper = createColumnHelper<Group>();

export const columns: ColumnDef<Group>[] = [
  {
    accessorKey: "name",
    header: () => <div className="p-2 px-6 font-bold">Name</div>,
    cell: ({ row }) => (
      <div className="p-2 px-6 capitalize">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "broker",
    header: () => <div className="p-2 px-6 font-bold">Broker</div>,
    cell: ({ row }) => (
      <Badge variant={"outline"} className="font-mono">
        {row.getValue("broker")}
      </Badge>
    ),
  },
  {
    accessorKey: "color",
    header: () => <div className="font-bold">Color</div>,
    cell: ({ row }) => (
      <div
        className="h-4 w-4 rounded-full"
        style={{
          backgroundColor: row.getValue("color"),
        }}
      ></div>
    ),
  },
  columnHelper.display({
    id: "select",
    cell: () => (
      <div className="flex justify-end gap-2 px-4 text-end">
        <PenLine size={20} className="text-neutral-500" />
        <Separator orientation="vertical" className="h-4 w-px" />
        <Trash2 size={20} className="text-neutral-500" />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }),
];

export function GroupDetailTable() {
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

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 py-4">
        <Input placeholder="Search groups..." className="max-w-xs" />

        <CreateGroupFormSheet />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="font-bold">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
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
