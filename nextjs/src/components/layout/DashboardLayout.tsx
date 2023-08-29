import SideNavBar from "./SideNavBar";

interface LayoutProps {
  children: React.ReactNode;
}

function DashboardLayout({ children }: LayoutProps) {
  return (
    <>
      <div className="font-strawford flex h-full min-h-screen flex-col bg-stone-100">
        <div className="flex flex-grow">
          <div className="fixed h-screen bg-stone-200">
            <SideNavBar />
          </div>
          <main className="h-full flex-grow overflow-auto pl-12">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

export default DashboardLayout;
