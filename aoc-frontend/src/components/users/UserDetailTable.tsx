"use client";

import { UserGroupsBadgeList } from "./UserGroupsBadgeList";

import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { UserInviteForm } from "./UserInviteForm";

import { type UserGroup, type UserGroupsListResponse } from "@/data/groups";
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
import { type OrgUser, type OrgUsersListResponse } from "@/data/users";
import { toast } from "sonner";
import { useAction } from "@/hooks/useAction";
import { deleteUserAction } from "./actions";
import {
  addUserToGroupAction,
  removeUserFromGroupAction,
} from "../groups/action";

type OrgUserFull = OrgUser & { nonMemberGroups: UserGroup[] };

const columnHelper = createColumnHelper<OrgUserFull>();

const createColumns = (
  onUserGroupUpdate?: (userId: string, groupId: string, action: 'add' | 'remove') => void,
  onUserDeleted?: () => void
): ColumnDef<OrgUserFull>[] => [
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
          id={userId}
          nonMemberGroups={nonMemberGroups}
          addAction={addUserToGroupAction}
          removeAction={removeUserFromGroupAction}
          onUserGroupUpdate={onUserGroupUpdate}
        />
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      return <UserActions id={id} onUserDeleted={onUserDeleted} />;
    },
  }),
];

type UserDetailTableProps = {
  setUserPage: React.Dispatch<React.SetStateAction<number>>;
  usersList?: OrgUsersListResponse;
  userGroups?: UserGroupsListResponse;
  onUserGroupUpdate?: (userId: string, groupId: string, action: 'add' | 'remove') => void; // Optimistic update callback
  onUserInvited?: () => void; // Callback when user is invited
  onUserDeleted?: () => void; // Callback when user is deleted
};

export function UserDetailTable(props: UserDetailTableProps) {
  const { 
    setUserPage, 
    usersList: orgUsers, 
    userGroups, 
    onUserGroupUpdate, 
    onUserInvited, 
    onUserDeleted 
  } = props;

  const { isAdmin: hasPerms } = useAdminStatus();

  console.log('UserDetailTable received data:', { orgUsers, userGroups });

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

  console.log('Processed users data:', orgUsersData);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: orgUsersData,
    columns: createColumns(onUserGroupUpdate, onUserDeleted),
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
      {hasPerms && <UserInviteForm onUserInvited={onUserInvited} />}

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
                    colSpan={createColumns(onUserGroupUpdate, onUserDeleted).length}
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
            onClick={() => setUserPage(prev => prev - 1)}
            disabled={!orgUsers?.previous}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUserPage(prev => prev + 1)}
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
  onUserDeleted?: () => void;
};

function UserActions(props: UserActionProps) {
  const { id, onUserDeleted } = props;

  const [open, setOpen] = React.useState(false);

  const { execute, isPending } = useAction(deleteUserAction, {
    onSuccess: () => {
      setOpen(false);
      toast.success("User deleted");
      // Notify parent component to refresh user list
      onUserDeleted?.();
    },
    onError: ({ error }) => {
      toast.error((error as any)?.serverError?.message ?? "Error deleting user");
    },
  });

  const { user: session } = useAuth();
  const { isAdmin } = useAdminStatus();

  const activeUserId = session?.id;

  const hasPerms = isAdmin && activeUserId !== id;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: formData.get("id") as string,
    };
    await execute(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={"ghost"} disabled={isPending || !hasPerms}>
          {isPending ? (
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
          <input type="hidden" name="id" defaultValue={id} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
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
