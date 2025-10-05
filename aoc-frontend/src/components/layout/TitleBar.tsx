import { useTitleBar } from "@/context/TitleBarProvider";

export function TitleBar() {
  const { title, icon, buttons } = useTitleBar();

  return (
    <div className="border-border flex flex-col border-b px-4 py-4 md:py-6">
      {/* Main content */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            <div className="flex gap-2 items-center">
              {icon}
              {title}
            </div>
          </h1>
        </div>
        {buttons && <div className="flex gap-2">{buttons}</div>}
      </div>
    </div>
  );
}
