import React, { use } from "react";

import { PanelContentSection } from "@/components/home/PanelContentSection";
import { TitleBar } from "@/components/layout/TitleBar";

export default function DahboardNestedPage(props: {
  params: Promise<{ id: string[] }>;
}) {
  const params = use(props.params);

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

      <PanelContentSection item_ids={params.id} />
    </div>
  );
}
