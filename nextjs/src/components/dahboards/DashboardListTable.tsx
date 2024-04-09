import {
  type ColumnFiltersState,
  type ExpandedState,
  type SortingState,
  type VisibilityState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
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
import { Checkbox } from "../ui/checkbox";
import { type DashboardEntry } from "@/types/dashboardList";
import { Input } from "../ui/input";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { CreateDashboardEntryFormSheet } from "./CreateDashboardEntryFormSheet";

const columnHelper = createColumnHelper<DashboardEntry>();

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
  columnHelper.accessor("img", {
    header: "",
    cell: ({ row }) => {
      return (
        <Image
          className="text-xs capitalize"
          src={"/anomaly-detector.png"}
          alt={row.getValue("name")}
          width={150}
          height={150}
        />
      );
    },
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: ({ row }) => {
      return <div className="text-xs capitalize">{row.getValue("name")}</div>;
    },
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: ({ row }) => {
      return (
        <div className="text-xs capitalize">{row.getValue("description")}</div>
      );
    },
  }),
  columnHelper.accessor("url", {
    header: "",
    cell: ({ row }) => {
      return (
        <Link
          href={row.getValue("url")}
          className="text-xs text-blue-700 underline"
        >
          {row.getValue("url")}
        </Link>
      );
    },
  }),
];

type DashboardListTableProps = {
  dashboardEntries: DashboardEntry[];
};

export default function DashboardListTable(props: DashboardListTableProps) {
  const data = React.useMemo(
    () => props.dashboardEntries,
    [props.dashboardEntries],
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

  return (
    <div className="w-full">
      <div className="flex items-center justify-between pb-4">
        <Input
          size={10}
          placeholder="Find dashboards..."
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
        <div>
          <CreateDashboardEntryFormSheet />
        </div>
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
