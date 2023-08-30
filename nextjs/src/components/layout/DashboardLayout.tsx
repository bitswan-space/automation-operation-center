import SideNavBar from "./SideNavBar";
import clsx from "clsx";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

function DashboardLayout({ children }: LayoutProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <>
      <div className="font-strawford flex h-full min-h-screen flex-col bg-stone-100">
        <div className="flex flex-grow">
          <div className="fixed h-screen bg-stone-200">
            <SideNavBar
              expanded={isExpanded}
              onExpand={() => setIsExpanded(!isExpanded)}
            />
          </div>
          <main
            className={clsx("h-full flex-grow overflow-auto", {
              "pl-64": isExpanded,
              "pl-20": !isExpanded,
            })}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

export default DashboardLayout;
