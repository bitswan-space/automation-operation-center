"use client";

import { UserGroupsBadgeList } from "./UserGroupsBadgeList";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

import { Badge } from "../ui/badge";

import { Loader2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { canMutateUsers } from "@/lib/permissions";
import { UserInviteForm } from "./UserInviteForm";
import {
  deleteUserAction,
  type DeleteUserActionState,
  type OrgUser,
  type OrgUsersListResponse,
} from "@/server/actions/users";
import {
  type UserGroup,
  type UserGroupsListResponse,
} from "@/server/actions/groups";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

type OrgUserFull = OrgUser & { nonMemberGroups: UserGroup[] };

const columnHelper = createColumnHelper<OrgUserFull>();
export const columns: ColumnDef<OrgUserFull>[] = [
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
            "bg-green-600": verified,
            "bg-amber-500": !verified,
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
      const groups = row.original.groups;
      const userId = row.original.id;
      const nonMemberGroups = row.original.nonMemberGroups;

      return (
        <UserGroupsBadgeList
          memberGroups={groups}
          userId={userId}
          nonMemberGroups={nonMemberGroups}
        />
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      return <UserActions id={id} />;
    },
  }),
];

type UserDetailTableProps = {
  usersList?: OrgUsersListResponse;
  userGroups?: UserGroupsListResponse;
};

export function UserDetailTable(props: UserDetailTableProps) {
  const { usersList: orgUsers, userGroups } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = searchParams?.get("page") ?? "1";

  const { data: session } = useSession();
  const hasPerms = canMutateUsers(session);

  const orgUsersData = React.useMemo(
    () =>
      orgUsers?.results?.map((user) => ({
        ...user,
        nonMemberGroups:
          userGroups?.results.filter(
            (group) => !user.groups.find((g) => g.id === group.id),
          ) ?? [],
      })) ?? [],
    [orgUsers, userGroups],
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

  const handlePageChange = (page: number) => {
    router.push(`/dashboard/settings?activeTab=users&page=${page}`);
  };

  return (
    <div className="w-full">
      {hasPerms && <UserInviteForm />}

      {orgUsersData && (
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
            onClick={() => handlePageChange(Number(page) - 1)}
            disabled={page === "1"}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Number(page) + 1)}
            disabled={!orgUsers?.next}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

type UserActionProps = {
  id: string;
};

function UserActions(props: UserActionProps) {
  const { id } = props;

  const [open, setOpen] = React.useState(false);

  const [state, formAction, isPending] = React.useActionState<
    DeleteUserActionState,
    FormData
  >(deleteUserAction, {});

  const { data: session } = useSession();

  const activeUserId = session?.user?.id;

  const hasPerms = canMutateUsers(session) && activeUserId !== id;

  // Close dialog after submit completes
  React.useEffect(() => {
    if (!isPending && state.status === "success") {
      setOpen(false);
    }
  }, [isPending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={"ghost"}
          disabled={isPending || !hasPerms}
        >
          {isPending ? (
            <Loader2 size={20} className="mr-2 animate-spin" />
          ) : (
            <Trash2 size={20} className="text-neutral-500" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              Do you really want to delete the user?
            </DialogDescription>
          </DialogHeader>
          <input type="hidden" name="id" defaultValue={id} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" type="submit" disabled={isPending}>
              {isPending ? (
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
