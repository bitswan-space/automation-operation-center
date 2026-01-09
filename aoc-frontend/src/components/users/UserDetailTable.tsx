import { UserGroupsBadgeList } from "./UserGroupsBadgeList";
import * as React from "react";

import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
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

import { Loader2, Trash } from "lucide-react";
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
import { useDeleteUser, useUsersInfiniteQuery } from "@/hooks/useUsersQuery";
import { useAuth } from "@/context/AuthContext";

const columnHelper = createColumnHelper<OrgUser>();

const createColumns = (): ColumnDef<OrgUser>[] => [
  {
    accessorKey: "email",
    header: () => <div className="px-3 text-left font-semibold">Email</div>,
    cell: ({ row }) => <div className="px-3">{row.getValue("email")}</div>,
  },

  {
    accessorKey: "verified",
    header: () => <div className="font-semibold">Status</div>,
    cell: ({ row }) => {
      const verified = row.getValue("verified");
      return (
        <Badge
          className={cn({
            "bg-green-100 text-green-600 hover:bg-green-100": verified,
            "bg-orange-100 text-orange-600 hover:bg-amber-100": !verified,
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
    cell: ({ row }) => {
      const id = row.original.id;
      return <UserActions id={id} />;
    },
  }),
];

export function UserDetailTable() { 
  // Search state with debouncing
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search input to avoid too many requests while typing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Scroll to top when search changes
  React.useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [debouncedSearch]);

  // Use infinite query for users
  const { 
    data: usersData, 
    isFetching: isFetchingUsers,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUsersInfiniteQuery(debouncedSearch);

  // Flatten all pages into a single array
  const orgUsersData = React.useMemo(
    () => usersData?.pages.flatMap((page) => page.results) ?? [],
    [usersData],
  );

  // Scroll detection for infinite scroll
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Load more when scrolled within 100px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 100 && hasNextPage && !isFetchingNextPage && !isFetchingUsers) {
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, isFetchingUsers, fetchNextPage]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: orgUsersData,
    columns: createColumns(),
    manualFiltering: true, // Server-side filtering/search
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <UserInviteForm search={search} onSearchChange={setSearch} />

      <div className="rounded-md border" ref={tableContainerRef} style={{ maxHeight: "600px", overflowY: "auto" }}>
        <Table>
          <TableHeader className="h-12">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="font-bold h-16 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="p-1">
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
              <>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="h-16 hover:bg-transparent"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-1">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {isFetchingNextPage && (
                  <TableRow>
                    <TableCell
                      colSpan={table.getAllColumns().length}
                      className="h-16 text-center"
                    >
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow className="hover:bg-transparent">
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
    </div>
  );
}

type UserActionProps = {
  id: string;
};

function UserActions(props: UserActionProps) {
  const { id } = props;

  const [open, setOpen] = React.useState(false);

  const { user } = useAuth();
  const deleteUserMutation = useDeleteUser();

  const handleDelete = async () => {
    deleteUserMutation.mutate(id, {
      onSuccess: () => {
        setOpen(false);
        toast.success("User deleted");
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
        <Button variant={"ghost"} disabled={deleteUserMutation.isPending || user?.id === id}>
          {deleteUserMutation.isPending ? (
            <Loader2 size={20} className="mr-2 animate-spin" />
          ) : (
            <Trash size={20} className="text-black" />
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
