import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

import { CreateDashboardEntryForm } from "./CreateDashboardEntryForm";
import { type DashboardEntry } from "@/types/dashboardList";

type CreateDashboardEntryFormSheetProps = {
  trigger: React.ReactNode;
  dashboardEntry?: DashboardEntry;
};

export function CreateDashboardEntryFormSheet(
  props: CreateDashboardEntryFormSheetProps,
) {
  const { trigger, dashboardEntry } = props;
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="min-w-full md:min-w-[550px]">
        <SheetHeader>
          <SheetTitle>
            {dashboardEntry ? "Edit" : "Create"} Dashboard entry
          </SheetTitle>
          <SheetDescription>
            Make changes to a dashboard entry. Click save when you&lsquo;re
            done.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <CreateDashboardEntryForm dashboardEntry={dashboardEntry} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
