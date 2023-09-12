import {
  BarChartBig,
  Braces,
  ChevronRight,
  Layers,
  SlidersHorizontal,
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
import { Button } from "@/components/ui/button";
import { JSONTree } from "react-json-tree";
import React from "react";
import clsx from "clsx";
import { memo } from "react";

type Section = "stats" | "configure" | "data" | "logs";
type ProcessorNodeActionType =
  | "toggleExpandStats"
  | "toggleExpandConfigure"
  | "toggleExpandData"
  | "toggleExpandLogs"
  | "togglePinStats"
  | "togglePinConfigure"
  | "togglePinData"
  | "togglePinLogs";
interface ProcessorNodeState {
  expandedSections: Section[];
  pinnedSections: Section[];
}

interface ProcessorNodeAction {
  type: ProcessorNodeActionType;
}

const toggleExpandedSection = (
  state: ProcessorNodeState,
  section: Section,
): ProcessorNodeState => {
  return {
    ...state,
    expandedSections: state.expandedSections.includes(section)
      ? state.expandedSections.filter((sec) => sec !== section)
      : [...state.pinnedSections, section],
  };
};

const reducer = (
  state: ProcessorNodeState,
  action: ProcessorNodeAction,
): ProcessorNodeState => {
  switch (action.type) {
    case "toggleExpandStats":
      return toggleExpandedSection(state, "stats");
    case "toggleExpandConfigure":
      return toggleExpandedSection(state, "configure");
    case "toggleExpandData":
      return toggleExpandedSection(state, "data");
    case "toggleExpandLogs":
      return toggleExpandedSection(state, "logs");
    default:
      return state;
  }
};

export function ProcessorNode() {
  const initialState: ProcessorNodeState = {
    expandedSections: [],
    pinnedSections: [],
  };

  const [state, dispatch] = React.useReducer<
    (
      state: ProcessorNodeState,
      action: ProcessorNodeAction,
    ) => ProcessorNodeState
  >(reducer, initialState);

  return (
    <Card className="w-[800px] rounded-sm border border-neutral-200 shadow-md">
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
        <CollapsibleSection
          title="Stats"
          icon={<BarChartBig size={18} className="text-neutral-600" />}
          expanded={state.expandedSections.includes("stats")}
          onToggleExpanded={() => dispatch({ type: "toggleExpandStats" })}
        >
          <div className="space-y-1.5 text-sm">
            <StatItem label="Input" value="234,234" />
            <StatItem label="Output" value="234,234" />
            <StatItem label="Topic" value="RawDataWMS" />
            <StatItem label="Avg delay" value="0.23s" />
            <StatItem label="Status" value={<Badge>Running</Badge>} />
          </div>
        </CollapsibleSection>
        <CollapsibleSection
          title="Configure"
          icon={<SlidersHorizontal size={18} className="text-neutral-600" />}
          expanded={state.expandedSections.includes("configure")}
          onToggleExpanded={() => dispatch({ type: "toggleExpandConfigure" })}
        >
          Collapsible Section
        </CollapsibleSection>
        <CollapsibleSection
          title="Data"
          icon={<Braces size={18} className="text-neutral-600" />}
          expanded={state.expandedSections.includes("data")}
          onToggleExpanded={() => dispatch({ type: "toggleExpandData" })}
        >
          <DataSectionBody />
        </CollapsibleSection>
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

interface CollapsibleSectionProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function CollapsibleSection(props: CollapsibleSectionProps) {
  const { title, icon, children, expanded, onToggleExpanded } = props;

  return (
    <Collapsible open={expanded} onOpenChange={onToggleExpanded}>
      <div
        className={clsx("flex w-full justify-between p-4", {
          "border-b bg-neutral-100": expanded,
        })}
      >
        <div className="flex gap-3">
          <CollapsibleTrigger className="rounded border text-neutral-500 data-[state=open]:rotate-90">
            <ChevronRight className="" size={18} />
          </CollapsibleTrigger>
          <span className=" text-sm font-bold uppercase text-neutral-600">
            {title}
          </span>
        </div>
        {icon}
      </div>

      <CollapsibleContent className="p-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

interface StatItemProps {
  label: string;
  value: React.ReactNode;
}

function StatItem(props: StatItemProps) {
  const { label, value } = props;
  return (
    <div className="flex justify-between">
      <span className="font-bold text-neutral-600">{label}:</span>
      <span className="w-2/3 text-start font-mono text-neutral-500">
        {value}
      </span>
    </div>
  );
}

enum DataSectionTabOptions {
  Input,
  Output,
  Logs,
}

function DataSectionBody({}) {
  const [activeTab, setActiveTab] = React.useState<DataSectionTabOptions>(
    DataSectionTabOptions.Input,
  );

  const jsonTreeTheme = {
    scheme: "custom",
    base00: "#ffffff", // background
    base03: "#0a0a0a", // number of keys or items
    base05: "#fafafa", // keys
    base09: "#ea580c", // numbers and bools
    base0B: "#dc2626", // values
    base0D: "#0a0a0a", // keys ->true
  };

  const inputSampleJSON = {
    _id: "64fccd06edfbc0facbf81b0a",
    index: 2,
    guid: "18df1723-9165-4af4-ae54-67a076c16c57",
    isActive: true,
    balance: "$2,019.26",
    picture: "http://placehold.it/32x32",
    age: 26,
    eyeColor: "blue",
    name: "Welch Phelps",
    phone: "+1 (881) 408-2102",
    address: "371 Langham Street, Soham, Federated States Of Micronesia, 6360",
    friends: [
      {
        id: 0,
        name: "Debbie Pena",
      },
      {
        id: 1,
        name: "Sue Brock",
      },
      {
        id: 2,
        name: "Osborne England",
      },
    ],
    greeting: "Hello, Welch Phelps! You have 5 unread messages.",
    favoriteFruit: "apple",
  };

  const outputSampleJSON = {
    _id: "64fccd06edfbc0facbf81b0a",
    index: 2,
    guid: "18df1723-9165-4af4-ae54-67a076c16c57",
  };

  return (
    <div className="w-full pb-8">
      <div className="flex w-full border-b border-neutral-300">
        <DataSectionTab
          isActive={activeTab === DataSectionTabOptions.Input}
          label="Sample Input"
          onClick={() => setActiveTab(DataSectionTabOptions.Input)}
        />
        <DataSectionTab
          isActive={activeTab === DataSectionTabOptions.Output}
          label="Sample Output"
          onClick={() => setActiveTab(DataSectionTabOptions.Output)}
        />
        <DataSectionTab
          isActive={activeTab === DataSectionTabOptions.Logs}
          label="Logs"
          onClick={() => setActiveTab(DataSectionTabOptions.Logs)}
        />
      </div>
      <div className="px-2">
        {activeTab === DataSectionTabOptions.Input && (
          <div className="font-mono text-sm">
            <JSONTree data={inputSampleJSON} theme={jsonTreeTheme} />
          </div>
        )}
        {activeTab === DataSectionTabOptions.Output && (
          <div className="font-mono text-sm">
            <JSONTree data={outputSampleJSON} theme={jsonTreeTheme} />
          </div>
        )}
        {activeTab === DataSectionTabOptions.Logs && <div>logs</div>}
      </div>
    </div>
  );
}

interface DataSectionTabProps {
  onClick?: () => void;
  isActive: boolean;
  label: string;
}

function DataSectionTab(props: DataSectionTabProps) {
  const { isActive, label, onClick } = props;

  return (
    <Button
      variant={"ghost"}
      className={clsx(
        "rounded-none px-4 py-1 font-semibold capitalize text-neutral-500",
        {
          "border-b-2 border-blue-500 bg-blue-100/60 text-neutral-800":
            isActive,
        },
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
