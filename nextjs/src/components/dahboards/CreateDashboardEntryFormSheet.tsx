import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

import { Button } from "../ui/button";
import { CreateDashboardEntryForm } from "./CreateDashboardEntryForm";
import { PlusCircle } from "lucide-react";

export function CreateDashboardEntryFormSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm">
          <PlusCircle size={20} className="mr-2" />
          Create Dashboard Entry
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-full md:min-w-[550px]">
        <SheetHeader>
          <SheetTitle>Create Dashboard entry</SheetTitle>
          <SheetDescription>
            Make changes to a dashboard entry. Click save when you&lsquo;re
            done.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <CreateDashboardEntryForm />
        </div>
      </SheetContent>
    </Sheet>
  );
}
