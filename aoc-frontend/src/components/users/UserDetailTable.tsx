import { UserGroupsBadgeList } from "./UserGroupsBadgeList";
import * as React from "react";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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

import { Badge } from "../ui/badge";

import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserInviteForm } from "./UserInviteForm";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { type OrgUser } from "@/data/users";
import { toast } from "sonner";
import { useDeleteUser, useUsersQuery } from "@/hooks/useUsersQuery";

const columnHelper = createColumnHelper<OrgUser>();

const createColumns = (): ColumnDef<OrgUser>[] => [
  {
    accessorKey: "email",
    header: () => <div className="p-2 px-6 text-left font-semibold">Email</div>,
    cell: ({ row }) => <div className="p-2 px-6">{row.getValue("email")}</div>,
  },

  {
    accessorKey: "verified",
    header: () => <div className="font-semibold">Status</div>,
    cell: ({ row }) => {
      const verified = row.getValue("verified");
      return (
        <Badge
          className={cn({
            "bg-green-600 hover:bg-green-600": verified,
            "bg-amber-500 hover:bg-amber-500": !verified,
          })}
        >
          {verified ? "Active" : "Invited"}
        </Badge>
      );
    },
  },
  columnHelper.display({
    id: "groups",
    header: () => <div className="font-semibold">Groups</div>,
    cell: ({ row }) => {
      return (
        <UserGroupsBadgeList
          user={row.original}
        />
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row, table }) => {
      const id = row.original.id;
      return <UserActions 
        id={id} 
        isLastItemOnPage={row.index === table.getRowModel().rows.length - 1}
        currentPageIndex={table.getState().pagination.pageIndex}
        onNavigateBack={() => table.previousPage()}
      />;
    },
  }),
];

export function UserDetailTable() { 
  // TanStack Table pagination state (pageIndex is 0-based, but API uses 1-based)
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Convert 0-based pageIndex to 1-based page number for API
  const page = pagination.pageIndex + 1;
  const { data: usersData, isFetching: isFetchingUsers } = useUsersQuery(page);

  const orgUsersData = React.useMemo(
    () => usersData?.results ?? [],
    [usersData],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: orgUsersData,
    columns: createColumns(),
    manualPagination: true, // Server-side pagination
    rowCount: usersData?.count ?? 10,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <UserInviteForm />

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
            {isFetchingUsers && !usersData ? (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  colSpan={table.getAllColumns().length}
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
            disabled={!table.getCanPreviousPage() || isFetchingUsers}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-14"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isFetchingUsers}
          >
            {isFetchingUsers ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

type UserActionProps = {
  id: string;
  isLastItemOnPage: boolean;
  currentPageIndex: number;
  onNavigateBack: () => void;
};

function UserActions(props: UserActionProps) {
  const { id, isLastItemOnPage, currentPageIndex, onNavigateBack } = props;

  const [open, setOpen] = React.useState(false);

  const deleteUserMutation = useDeleteUser();

  const handleDelete = async () => {
    deleteUserMutation.mutate(id, {
      onSuccess: () => {
        setOpen(false);
        toast.success("User deleted");
        // If this was the last item on the page and we're not on the first page, go back
        if (isLastItemOnPage && currentPageIndex > 0) {
          onNavigateBack();
        }
      },
      onError: (error) => {
        toast.error((error as any)?.message ?? "Error deleting user");
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleDelete();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"ghost"} disabled={deleteUserMutation.isPending}>
          {deleteUserMutation.isPending ? (
            <Loader2 size={20} className="mr-2 animate-spin" />
          ) : (
            <Trash2 size={20} className="text-neutral-500" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              Do you really want to delete the user?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" type="submit" disabled={deleteUserMutation.isPending}>
              {deleteUserMutation.isPending ? (
                <Loader2 size={20} className="mr-2 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
