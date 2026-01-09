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

import { Input } from "@/components/ui/input";
import { Loader2, Pen, Search, Trash } from "lucide-react";
import { CreateGroupFormSheet } from "./CreateGroupFormSheet";

import { useAdminStatus } from "@/hooks/useAdminStatus";

import { type UserGroup } from "@/data/groups";
import { toast } from "sonner";
import { useDeleteGroup, useGroupsInfiniteQuery } from "@/hooks/useGroupQuery";

const columnHelper = createColumnHelper<UserGroup>();

const createColumns = (): ColumnDef<UserGroup>[] => [
  {
    accessorKey: "name",
    header: () => <div className="px-3 text-left font-bold">Name</div>,
    cell: ({ row }) => <div className="px-3 font-bold">{row.getValue("name")}</div>,
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
      return <GroupActions 
        id={id} 
        group={row.original} 
      />;
    },
    enableSorting: false,
    enableHiding: false,
  }),
];

export function GroupDetailTable() {
  const { isAdmin: hasPerms } = useAdminStatus();

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

  // Use infinite query for groups
  const { 
    data: groupsData, 
    isFetching: isFetchingGroups,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGroupsInfiniteQuery(debouncedSearch);

  // Flatten all pages into a single array
  const userGroupsData = React.useMemo(
    () => {
      const results = groupsData?.pages.flatMap((page) => page.results) ?? [];
      // Sort so "admin" appears first
      return [...results].sort((a, b) => {
        if (a.name === "admin") return -1;
        if (b.name === "admin") return 1;
        return 0;
      });
    },
    [groupsData],
  );

  // Scroll detection for infinite scroll
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Load more when scrolled within 100px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 100 && hasNextPage && !isFetchingNextPage && !isFetchingGroups) {
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, isFetchingGroups, fetchNextPage]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: userGroupsData,
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
      <p className="text-sm text-gray-700 mt-6 mb-2">
        User groups let you assign workspace access to all their members at once and define group-specific shortcuts visible in the sidebar and on the homepage.
      </p>
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search user groups"
            className="pl-8"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
          />
        </div>

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
          />
        )}
      </div>

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
            {isFetchingGroups && !groupsData ? (
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

type GroupActionProps = {
  id: string;
  group: UserGroup;
};

function GroupActions(props: GroupActionProps) {
  const { id, group } = props;

  const { isAdmin: hasPerms } = useAdminStatus();

  const deleteGroupMutation = useDeleteGroup();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const groupId = formData.get("id") as string;
    
    deleteGroupMutation.mutate(groupId, {
      onSuccess: () => {
        toast.success("Group deleted");
      },
      onError: (error) => {
        toast.error((error as any)?.message ?? "Error deleting group");
      },
    });
  };

  const isAdminGroup = group.name === "admin";

  return (
    hasPerms && (
      <div className="flex justify-end gap-2 px-4 text-end">
        <CreateGroupFormSheet
          trigger={
            <Button variant={"ghost"} onClick={() => console.log("edit")}>
              <Pen size={20} className="text-black" />
            </Button>
          }
          group={group}
        />
        {!isAdminGroup && (
          <form onSubmit={handleSubmit}>
            <Button variant={"ghost"} disabled={deleteGroupMutation.isPending || !hasPerms} type="submit">
              <input type="hidden" name="id" defaultValue={id} />
              {deleteGroupMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Trash size={20} className="text-black" />
              )}
            </Button>
          </form>
        )}
      </div>
    )
  );
}
