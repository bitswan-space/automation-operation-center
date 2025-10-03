import { Button } from "@/components/ui/button";
import { Label } from "../ui/label";
import { Switch } from "@/components/ui/switch";
import { useSidebar } from "../ui/sidebar";
import { useSidebarItems } from "@/context/SideBarItemsProvider";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { createOrUpdateOrgGroupAction } from "../groups/action";
import { useAdminStatus } from "@/hooks/useAdminStatus";

export function SwitchForm() {
  const { editMode, setEditMode } = useSidebar();

  const { deserializedNavItems, activeProfile } = useSidebarItems();

  const { isAdmin } = useAdminStatus();

  const { execute, isPending, result } = useAction(
    createOrUpdateOrgGroupAction,
    {
      onSuccess: ({ data }) => {
        toast.success(data?.message ?? "Group updated successfully");
      },
      onError: ({ error }) => {
        console.error(error);
        toast.error("Error updating group");
      },
    },
  );

  const hasPerms = isAdmin;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-4 text-lg font-medium">General Settings</h3>
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Toggle Navbar Edit Mode</Label>
              <div className="text-sm text-neutral-500">
                Enable or disable edit mode for the dashboard&apos;s navigation
                bar.
              </div>
            </div>

            <Switch
              checked={editMode}
              onCheckedChange={setEditMode}
              disabled={!hasPerms}
            />
          </div>
        </div>
      </div>
      <div className="text-end">
        <form onSubmit={(e) => {
          e.preventDefault();
          execute({
            id: activeProfile?.id,
            name: activeProfile?.name,
            nav_items: JSON.stringify(deserializedNavItems),
          });
        }}>
          <input
            name="id"
            type="hidden"
            defaultValue={activeProfile?.id}
          />
          <input
            name="name"
            type="hidden"
            defaultValue={activeProfile?.name}
          />
          <input
            name="nav_items"
            type="hidden"
            defaultValue={JSON.stringify(deserializedNavItems)}
          />
          <Button type="submit" disabled={!editMode || isPending || !hasPerms}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>
    </div>
  );
}
