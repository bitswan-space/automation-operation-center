import PanelItemsSection from "@/components/home/PanelItemsSection";
import React from "react";
import { TitleBar } from "@/components/layout/TitleBar";

export default function DahboardHomePage() {
  return (
    <div>
      <TitleBar title="Dashboard"/>
      <div className="w-full p-4">
        <h1 className="text-2xl font-bold text-neutral-700 md:hidden">
          PoC Admin Panel
        </h1>
        <div className="inset-x-0 mx-auto">
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
    </div>
  );
}
