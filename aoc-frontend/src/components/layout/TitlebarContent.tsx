import { Card, CardContent } from "../ui/card";

import clsx from "clsx";

export type TitleBarContentProps = {
  className?: string;
  title: React.ReactNode;
};

export function TitleBarContent(props: TitleBarContentProps) {
  const { className, title } = props;
  return (
    <div className={clsx("hidden md:block", className)}>
      <div className="border-border flex flex-col border-b px-4 py-4 md:py-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {title}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}