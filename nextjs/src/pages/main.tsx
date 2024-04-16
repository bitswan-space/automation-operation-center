import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LayoutDashboard, LucideArrowUpRight, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TitleBar } from "@/components/layout/TitleBar";
import clsx from "clsx";

const MainHomePage = () => {
  return (
    <div className="h-full min-h-screen bg-neutral-100 p-4">
      <h1 className="text-2xl font-bold text-neutral-700 md:hidden">
        Bitswan Admin Hub
      </h1>
      <div className="fixed inset-x-0 top-10 z-50 mx-auto max-w-[84rem]">
        <TitleBar
          title={
            <div className="mt-1 flex h-full gap-4 text-center align-middle">
              <div>
                <Image
                  src={"/bitswan-logo-sm.jpeg"}
                  alt={""}
                  width={25}
                  height={25}
                  className={clsx("w-5.5 h-7.5")}
                />
              </div>
              <span>PoC Admin Panel</span>
            </div>
          }
          className="dark relative"
        />
        <div className="pt-6 text-base">
          Welcome to the{" "}
          <strong className="font-semibold text-neutral-700">
            Bitswan Pipeline Operations Center,
          </strong>
        </div>
      </div>

      <div className="mx-auto flex max-w-[84rem] flex-col gap-8 pt-48">
        <div className="grid grid-cols-3 gap-4">
          <PanelActionCard
            title="Running pipelines"
            description="View and manage your pipelines"
            count={0}
            icon={<RefreshCcw size={22} />}
          />
          <PanelActionCard
            title="Dashboard Hub Entries"
            description="dashboard entries"
            count={0}
            icon={<LayoutDashboard size={22} />}
          />
          <PanelActionCard
            title="Dashboard Hub"
            description="dashboard entries"
            count={0}
            icon={<LayoutDashboard size={22} />}
          />
        </div>
      </div>
    </div>
  );
};

export default MainHomePage;

type PanelActionCardProps = {
  title: string;
  description: string;
  count: number;
  icon: React.ReactNode;
};

function PanelActionCard(props: PanelActionCardProps) {
  const { title, description, count, icon } = props;

  return (
    <Card className="rounded-md">
      <CardHeader className="rounded-t-md bg-neutral-800 text-neutral-300">
        <div className="flex justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between pt-4">
          <div className="flex gap-2  align-bottom">
            <div className="text-4xl font-bold text-neutral-700">{count}</div>
            <div className="mt-auto text-sm lowercase text-neutral-500">
              {title}
            </div>
          </div>
          <Button variant={"outline"} size={"sm"}>
            View <LucideArrowUpRight size={20} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
