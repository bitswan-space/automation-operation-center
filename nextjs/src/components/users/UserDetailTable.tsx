"use client";

import * as React from "react";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
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
import { Badge } from "../ui/badge";
import { GroupComboBoxSelector } from "./GroupComboBoxSelector";

const data: User[] = [
  {
    id: "m5gr84i9",
    name: "Kenny Lee",
    groups: [
      {
        name: "Management",
        color: "#1d4ed8",
      },
      {
        name: "HR",
        color: "#d97706",
      },
      {
        name: "Support",
        color: "#15803d",
      },
    ],
    email: "ken99@yahoo.com",
  },
  {
    id: "3u1reuv4",
    name: "Abel Lee",
    groups: [
      {
        name: "Admin",
        color: "#6d28d9",
      },
    ],
    email: "Abe45@gmail.com",
  },
  {
    id: "derv1ws0",
    name: "Monserrat Lee",
    groups: [
      {
        name: "HR",
        color: "#d97706",
      },
      {
        name: "Support",
        color: "#15803d",
      },
    ],
    email: "Monserrat44@gmail.com",
  },
  {
    id: "5kma53ae",
    name: "Silas Lee",
    groups: [
      {
        name: "Management",
        color: "#1d4ed8",
      },
      {
        name: "Admin",
        color: "#6d28d9",
      },
    ],
    email: "Silas22@gmail.com",
  },
];

type Group = {
  name: string;
  color: string;
};

export type User = {
  id: string;
  name: string;
  groups: Group[];
  email: string;
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: () => <div className="p-2 px-6 text-left font-semibold">Name</div>,
    cell: ({ row }) => (
      <div className="p-2 px-6 capitalize">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: () => <div className="font-semibold">Email</div>,
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "groups",
    header: () => <div className="font-semibold">Groups</div>,
    cell: ({ row }) => {
      const groups = row.original.groups;

      return (
        <div className="flex max-w-3xl flex-wrap gap-2 ">
          {groups.map((group, index) => {
            return (
              <Badge
                key={index}
                variant={"outline"}
                className={`border-[${group.color}] bg-[${group.color}]/10 text-[${group.color}]`}
                style={{
                  borderColor: group.color,
                  backgroundColor: `${group.color}1A`,
                  color: group.color,
                }}
              >
                {group.name}
              </Badge>
            );
          })}
          <GroupComboBoxSelector />
        </div>
      );
    },
  },
];

export function UserDetailTable() {
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
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="Team member email "
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-xs"
        />
        <Button className="bg-blue-600 px-16 hover:bg-blue-700/80">
          Invite
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
