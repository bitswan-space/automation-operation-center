import {
  BarChartBig,
  Braces,
  ChevronRight,
  Layers,
  SlidersHorizontal,
  Terminal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Handle, Position } from "reactflow";

import { Badge } from "@/components/ui/badge";
import { memo } from "react";

export function ProcessorNode({}) {
  return (
    <Card className="w-[600px] rounded-sm border border-neutral-200 shadow-md">
      <CardHeader className="rounded-t-sm bg-neutral-950 text-neutral-200">
        <div className="flex">
          <Layers />
          <div>
            <CardTitle className="ml-2">Custom Processor</CardTitle>
            <CardDescription className="ml-2">Processor</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="divide-y p-0">
        <Collapsible className="p-4 data-[state=open]:bg-neutral-100/50">
          <div className="flex w-full justify-between">
            <div className="flex gap-3">
              <CollapsibleTrigger className="rounded border text-neutral-500 data-[state=open]:rotate-90">
                <ChevronRight className="" size={18} />
              </CollapsibleTrigger>
              <span className=" text-sm font-bold uppercase text-neutral-600">
                stats
              </span>
            </div>
            <BarChartBig size={18} className="text-neutral-600" />
          </div>

          <CollapsibleContent>
            <div className="space-y-1.5 py-2 text-sm">
              <div className="flex justify-between">
                <span className="font-bold text-neutral-600">Input</span>
                <span className="w-2/3 text-start font-semibold text-neutral-500">
                  234,234
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-neutral-600">Output</span>
                <span className="w-2/3 text-start font-semibold text-neutral-500">
                  234,234
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-neutral-600">Topic</span>
                <span className="w-2/3 text-start font-semibold text-neutral-500">
                  RawDataWMS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-neutral-600">Avg delay</span>
                <span className="w-2/3 text-start font-semibold text-neutral-500">
                  0.23s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-neutral-600">Status</span>
                <span className="w-2/3 text-start font-semibold">
                  <Badge>Running</Badge>
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible className="p-4">
          <div className="flex w-full justify-between">
            <div className="flex gap-3">
              <CollapsibleTrigger className="rounded border text-neutral-500 data-[state=open]:rotate-90">
                <ChevronRight className="" size={18} />
              </CollapsibleTrigger>
              <span className=" text-sm font-bold uppercase text-neutral-600">
                configure
              </span>
            </div>
            <SlidersHorizontal size={18} className="text-neutral-600" />
          </div>

          <CollapsibleContent>Collapsible Section</CollapsibleContent>
        </Collapsible>
        <Collapsible className="p-4">
          <div className="flex w-full justify-between">
            <div className="flex gap-3">
              <CollapsibleTrigger className="rounded border text-neutral-500 data-[state=open]:rotate-90">
                <ChevronRight className="" size={18} />
              </CollapsibleTrigger>
              <span className=" text-sm font-bold uppercase text-neutral-600">
                data
              </span>
            </div>
            <Braces size={18} className="text-neutral-600" />
          </div>

          <CollapsibleContent>Collapsible Section</CollapsibleContent>
        </Collapsible>
        <Collapsible className="p-4">
          <div className="flex w-full justify-between">
            <div className="flex gap-3">
              <CollapsibleTrigger className="rounded border text-neutral-500 data-[state=open]:rotate-90">
                <ChevronRight className="" size={18} />
              </CollapsibleTrigger>
              <span className=" text-sm font-bold uppercase text-neutral-600">
                logs
              </span>
            </div>
            <Terminal size={18} className="text-neutral-600" />
          </div>

          <CollapsibleContent>Collapsible Section</CollapsibleContent>
        </Collapsible>
      </CardContent>
      <Handle
        type="target"
        position={Position.Top}
        className="w-16 !bg-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-16 !bg-neutral-900"
      />
    </Card>
  );
}

export default memo(ProcessorNode);
