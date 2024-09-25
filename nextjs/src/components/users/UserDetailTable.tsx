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
import { GroupComboBoxSelector } from "../groups/GroupComboBoxSelector";
import { type OrgUser, useOrgUsers } from "./usersHooks";
import {
  removeMemberFromGroup,
  useUserGroups,
  type UserGroup,
} from "../groups/groupsHooks";
import { Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ORG_USERS_QUERY_KEY } from "@/shared/constants";

export const columns: ColumnDef<OrgUser>[] = [
  {
    accessorKey: "username",
    header: () => <div className="p-2 px-6 text-left font-semibold">Name</div>,
    cell: ({ row }) => (
      <div className="p-2 px-6">{row.getValue("username")}</div>
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
      const userId = row.original.id;

      return <GroupBadgeList groups={groups} userId={userId} />;
    },
  },
];

export function UserDetailTable() {
  const { data: orgUsers } = useOrgUsers();
  console.log("orgUsers", orgUsers);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: orgUsers?.results ?? [],
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
        <Input placeholder="Team member email " className="max-w-xs" />
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

type GroupBadgeListProps = {
  groups: UserGroup[];
  userId: string;
};

function GroupBadgeList(props: GroupBadgeListProps) {
  const { groups: userGroups, userId } = props;
  const { data: allOrgGroups } = useUserGroups();

  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const accessToken = session?.access_token;

  const removeMemberFromGroupMutation = useMutation({
    mutationFn: removeMemberFromGroup,
    onSuccess: () => {
      console.log("User group updated");
      queryClient
        .invalidateQueries({
          queryKey: [ORG_USERS_QUERY_KEY],
        })
        .then(() => {
          console.log("Invalidated org-users query");
        })
        .catch((error) => {
          console.error("Error invalidating org-users query", error);
        });
    },
  });

  const unselectedGroups = React.useMemo(() => {
    if (userGroups.length === 0) return allOrgGroups?.results;
    return allOrgGroups?.results?.filter((orgGroup) =>
      userGroups.find((userGroup) => orgGroup.id !== userGroup.id),
    );
  }, [allOrgGroups?.results, userGroups]);

  console.log("unselectedGroups", unselectedGroups);
  console.log("allOrgGroups", allOrgGroups);
  console.log("userGroups", userGroups);

  const onRemoveGroupClick = (groupId?: string) => {
    console.log("remove group", groupId);
    removeMemberFromGroupMutation.mutate({
      accessToken: accessToken ?? "",
      userId: userId,
      groupId: groupId ?? "",
    });
  };

  const isLoading = removeMemberFromGroupMutation.isLoading;
  return (
    <div className="flex max-w-3xl flex-wrap gap-2 ">
      {userGroups.map((group) => {
        return (
          <Badge
            key={group.id}
            variant={"outline"}
            className={`border-[${group.tag_color}] bg-[${group.tag_color}]/10 text-[${group.tag_color}] flex gap-2`}
            style={{
              borderColor: group.tag_color,
              backgroundColor: `${group.tag_color}1A`,
              color: group.tag_color,
            }}
          >
            <span>{group.name}</span>
            <button
              className="cursor-pointer"
              onClick={() => onRemoveGroupClick(group.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4 " />
              )}
            </button>
          </Badge>
        );
      })}
      <GroupComboBoxSelector groups={unselectedGroups ?? []} userId={userId} />
    </div>
  );
}
