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
import { Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const data: Group[] = [
  {
    id: "1",
    name: "Management",
    color: "#1d4ed8",
  },
  {
    id: "2",
    name: "HR",
    color: "#d97706",
  },
  {
    id: "3",
    name: "Support",
    color: "#15803d",
  },
  {
    id: "4",
    name: "Admin",
    color: "#6d28d9",
  },
];

type Group = {
  id: string;
  name: string;
  color: string;
};

const columnHelper = createColumnHelper<Group>();

export const columns: ColumnDef<Group>[] = [
  {
    accessorKey: "name",
    header: () => <div className="p-2 px-6 text-left font-semibold">Name</div>,
    cell: ({ row }) => (
      <div className="p-2 px-6 capitalize">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "color",
    header: () => <div className="font-semibold">Color</div>,
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
      <div className="flex justify-end px-4 text-end">
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

  const groupColors = ["#1d4ed8", "#d97706", "#15803d", "#6d28d9"];

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 py-4">
        <Input placeholder="Group name" className="max-w-xs" />
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group color" />
          </SelectTrigger>
          <SelectContent>
            {groupColors.map((color) => (
              <SelectItem value={color} key={color}>
                <div className="flex gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{
                      backgroundColor: color,
                    }}
                  ></div>
                  <div>{color}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="bg-blue-600 px-16 hover:bg-blue-700/80">
          Create Group
        </Button>
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
