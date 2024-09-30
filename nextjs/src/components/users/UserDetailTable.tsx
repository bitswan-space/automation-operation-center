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
import { Badge } from "../ui/badge";
import { GroupComboBoxSelector } from "../groups/GroupComboBoxSelector";
import {
  deleteUser,
  inviteUser,
  type OrgUser,
  useOrgUsers,
} from "./usersHooks";
import {
  removeMemberFromGroup,
  useUserGroups,
  type UserGroup,
} from "../groups/groupsHooks";
import { Loader, Loader2, Trash2, X, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ORG_USERS_QUERY_KEY } from "@/shared/constants";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { type AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const columnHelper = createColumnHelper<OrgUser>();
export const columns: ColumnDef<OrgUser>[] = [
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

      return <GroupBadgeList groups={groups} userId={userId} />;
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

export function UserDetailTable() {
  const { data: orgUsers, isLoading, isError } = useOrgUsers();

  const orgUsersData = React.useMemo(() => orgUsers?.results ?? [], [orgUsers]);

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

  return (
    <div className="w-full">
      <UserInviteForm />
      {isError && (
        <div className="flex h-60 w-full items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 p-4 text-center">
          <div className="flex flex-col items-center justify-between gap-4 py-4">
            <XCircle size={40} className="mx-auto" />
            <div className="text-sm text-neutral-500">Error fetching users</div>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex h-60 w-full items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 p-4 text-center">
          <div className="flex flex-col items-center justify-between gap-4 py-4">
            <Loader2 size={20} className="mr-2 animate-spin" />
            <div className="text-sm text-neutral-500">Loading users...</div>
          </div>
        </div>
      )}
      {!isLoading && !isError && orgUsersData && (
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

type GroupBadgeListProps = {
  groups: UserGroup[];
  userId: string;
};

function GroupBadgeList(props: GroupBadgeListProps) {
  const { groups, userId } = props;
  const { data: allOrgGroups } = useUserGroups();

  const userGroups = React.useMemo(() => {
    return groups;
  }, [groups]);

  const unselectedGroups = React.useMemo(() => {
    if (userGroups.length === 0) return allOrgGroups?.results;
    return allOrgGroups?.results?.filter(
      (orgGroup) =>
        !userGroups.find((userGroup) => orgGroup.id === userGroup.id),
    );
  }, [allOrgGroups?.results, userGroups]);

  return (
    <div className="flex max-w-3xl flex-wrap gap-2 ">
      {userGroups.map((group) => {
        return <UserGroupBadge group={group} key={group.id} userId={userId} />;
      })}
      <GroupComboBoxSelector groups={unselectedGroups} userId={userId} />
    </div>
  );
}

type UserGroupBadgeProps = {
  group: UserGroup;
  userId: string;
};

function UserGroupBadge(props: UserGroupBadgeProps) {
  const { group, userId } = props;

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

  const onRemoveGroupClick = (groupId?: string) => {
    removeMemberFromGroupMutation.mutate({
      accessToken: accessToken ?? "",
      userId: userId,
      groupId: groupId ?? "",
    });
  };

  const isLoading = removeMemberFromGroupMutation.isLoading;

  return (
    <Badge
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
}

const UserInviteFormSchema = z.object({
  email: z.string().email(),
});

function UserInviteForm({}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const accessToken = session?.access_token;

  const form = useForm<z.infer<typeof UserInviteFormSchema>>({
    resolver: zodResolver(UserInviteFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const invalidateOrgUsersQuery = () => {
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
  };

  const inviteUserMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      console.log("User invited");
      invalidateOrgUsersQuery();

      toast.success("User invited", {
        duration: 5000,
      });
    },
    onError: (error: AxiosError) => {
      console.error("Error inviting user", error);
      const errorMessage = (error.response?.data as { error: string })?.error;
      if (errorMessage) {
        form.setError("email", { type: "manual", message: errorMessage });
      }
    },
  });

  function onSubmit(values: z.infer<typeof UserInviteFormSchema>) {
    console.log("submitting");
    console.log(values);

    inviteUserMutation.mutate({
      accessToken: accessToken ?? "",
      email: values.email,
    });
  }

  const isLoading = inviteUserMutation.isLoading;

  return (
    <Form {...form}>
      <form onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
        <div className="flex items-center gap-4 py-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="max-w-sm flex-1">
                <FormControl>
                  <Input
                    placeholder="Team member email "
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                {form.formState.errors.email?.message && (
                  <FormMessage>
                    {form.formState.errors.email?.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />

          <Button
            className="mb-auto bg-blue-600 px-16 hover:bg-blue-700/80"
            disabled={isLoading}
          >
            Invite{" "}
            {isLoading && (
              <span>
                <Loader size={20} className="ml-2 animate-spin" />
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type UserActionProps = {
  id: string;
};

function UserActions(props: UserActionProps) {
  const { id } = props;
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const accessToken = session?.access_token;

  const deleteUserGroupMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      console.log("Org user deleted");
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

      toast.success("User deleted", {
        duration: 5000,
      });
    },
  });

  const handleDeleteClick = () => {
    deleteUserGroupMutation.mutate({
      apiToken: accessToken ?? "",
      id: id,
    });
  };

  const isLoading = deleteUserGroupMutation.isLoading;
  return (
    <div className="flex justify-end gap-2 px-4 text-end">
      <Button
        variant={"ghost"}
        onClick={handleDeleteClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 size={20} className="mr-2 animate-spin" />
        ) : (
          <Trash2 size={20} className="text-neutral-500" />
        )}
      </Button>
    </div>
  );
}
