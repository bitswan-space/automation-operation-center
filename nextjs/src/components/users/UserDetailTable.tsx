"use client";

import { UserGroupsBadgeList } from "./UserGroupsBadgeList";

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
import {
  deleteUser,
  inviteUser,
  type OrgUser,
  OrgUsersListResponse,
} from "./usersHooks";
import { UserGroupsListResponse, type UserGroup } from "../groups/groupsHooks";
import { Loader, Loader2, Trash2 } from "lucide-react";
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
import { canMutateUsers } from "@/lib/permissions";

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

  const { data: session } = useSession();
  const hasPerms = canMutateUsers(session);

  const orgUsersData = React.useMemo(
    () =>
      orgUsers?.results.map((user) => ({
        ...user,
        nonMemberGroups:
          userGroups?.results.filter(
            (group) => !user.groups.find((g) => g.id === group.id),
          ) ?? [],
      })) ?? [],
    [orgUsers],
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

  const isLoading = inviteUserMutation.isPending;

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
            className="mb-auto bg-blue-600 hover:bg-blue-700/80"
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
  const activeUserId = session?.user?.id;

  const hasPerms = canMutateUsers(session);

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

    onError: (error: AxiosError) => {
      console.error("Error deleting user", error);
      const errorMessage = (error.response?.data as { error: string })?.error;
      if (errorMessage) {
        toast.error(errorMessage, {
          duration: 5000,
        });
      }
    },
  });

  const handleDeleteClick = () => {
    deleteUserGroupMutation.mutate({
      apiToken: accessToken ?? "",
      id: id,
    });
  };

  const isLoading = deleteUserGroupMutation.isPending;
  const isCurrentUser = activeUserId === id;
  return (
    <div className="flex justify-end gap-2 px-4 text-end">
      {hasPerms && (
        <Button
          variant={"ghost"}
          onClick={handleDeleteClick}
          disabled={isLoading || isCurrentUser || !hasPerms}
        >
          {isLoading ? (
            <Loader2 size={20} className="mr-2 animate-spin" />
          ) : (
            <Trash2 size={20} className="text-neutral-500" />
          )}
        </Button>
      )}
    </div>
  );
}
