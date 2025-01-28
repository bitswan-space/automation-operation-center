import PanelItemsSection from "@/components/home/PanelItemsSection";
import React from "react";
import { TitleBar } from "@/components/layout/TitleBar";

export default function DahboardHomePage() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-neutral-700 md:hidden">
        PoC Admin Panel
      </h1>
      <div className="inset-x-0 mx-auto mt-2">
        <TitleBar
          title={
            <div className="mt-1 flex h-full gap-4 text-center align-middle">
              <span>PoC Admin Panel</span>
            </div>
          }
        />
        <div className="pt-6 text-base">
          Welcome to the{" "}
          <strong className="font-semibold text-neutral-700">
            Bitswan Pipeline Operations Center,
          </strong>
        </div>
      </div>

      <div className="mx-auto mt-6 flex flex-col gap-8">
        <PanelItemsSection showDefaultItems />
      </div>
    </div>
  );
}
