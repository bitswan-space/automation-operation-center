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
import { Loader2, PenLine, Trash2 } from "lucide-react";
import { CreateGroupFormSheet } from "./CreateGroupFormSheet";
import { Separator } from "../ui/separator";

import { useAuth } from "@/context/AuthContext";
import { canMutateGroups } from "@/lib/permissions";

import { type UserGroup, type UserGroupsListResponse } from "@/data/groups";
import { toast } from "sonner";
import { useAction } from "@/hooks/useAction";
import { deleteOrgGroupAction } from "./action";

const columnHelper = createColumnHelper<UserGroup>();

const createColumns = (onGroupCreated?: () => void): ColumnDef<UserGroup>[] => [
  {
    accessorKey: "name",
    header: () => <div className="p-2 px-6 font-bold">Name</div>,
    cell: ({ row }) => <div className="p-2 px-6">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "tag_color",
    header: () => <div className="font-bold">Color</div>,
    cell: ({ row }) => (
      <div
        className="h-4 w-4 rounded-full"
        style={{
          backgroundColor: row.getValue("tag_color"),
        }}
      ></div>
    ),
  },
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      return <GroupActions id={id} group={row.original} onGroupCreated={onGroupCreated} />;
    },
    enableSorting: false,
    enableHiding: false,
  }),
];

type GroupDetailTableProps = {
  userGroups?: UserGroupsListResponse;
  onGroupCreated?: () => void;
};

export function GroupDetailTable(props: GroupDetailTableProps) {
  const { userGroups, onGroupCreated } = props;

  const { user: session } = useAuth();

  const hasPerms = canMutateGroups(session);

  const userGroupsData = React.useMemo(
    () => userGroups?.results ?? [],
    [userGroups],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: userGroupsData,
    columns: createColumns(onGroupCreated),
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

        {hasPerms && (
          <CreateGroupFormSheet
            trigger={
              <Button
                className="bg-blue-600 hover:bg-blue-700/80"
                disabled={!hasPerms}
              >
                Create Group
              </Button>
            }
            onGroupCreated={onGroupCreated}
          />
        )}
      </div>

      {userGroups && (
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
      )}
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

type GroupActionProps = {
  id: string;
  group: UserGroup;
  onGroupCreated?: () => void;
};

function GroupActions(props: GroupActionProps) {
  const { id, group, onGroupCreated } = props;

  const { user: session } = useAuth();
  const hasPerms = canMutateGroups(session);

  const { execute, isPending } = useAction(deleteOrgGroupAction, {
    onSuccess: () => {
      toast.success("Group deleted");
    },
    onError: ({ error }) => {
      toast.error((error as any)?.serverError?.message ?? "Error deleting group");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: formData.get("id") as string,
    };
    await execute(data);
  };

  return (
    hasPerms && (
      <div className="flex justify-end gap-2 px-4 text-end">
        <CreateGroupFormSheet
          trigger={
            <Button variant={"ghost"} onClick={() => console.log("edit")}>
              <PenLine size={20} className="text-neutral-500" />
            </Button>
          }
          group={group}
          onGroupCreated={onGroupCreated}
        />
        <Separator orientation="vertical" className="h-8 w-px" />
        <form onSubmit={handleSubmit}>
          <Button variant={"ghost"} disabled={isPending || !hasPerms} type="submit">
            <input type="hidden" name="id" defaultValue={id} />
            {isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Trash2 size={20} className="text-neutral-500" />
            )}
          </Button>
        </form>
      </div>
    )
  );
}
