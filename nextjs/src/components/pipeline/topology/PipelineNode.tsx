"use client";

import {
  Braces,
  CheckCheck,
  ChevronRight,
  Copy,
  Layers,
  Loader,
  PauseCircle,
  Play,
  Search,
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
import { Handle, Position } from "@xyflow/react";
import React, { memo } from "react";
import { SiApachekafka, SiJavascript } from "react-icons/si";
import { jsonTreeTheme, outputSampleJSON } from "@/utils/jsonTree";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { JSONTree } from "react-json-tree";
import clsx from "clsx";
import { epochToFormattedTime } from "@/utils/time";
import { handleError } from "@/utils/errors";
import { joinIDsWithDelimiter } from "@/utils/pipelineUtils";
import { useClipboard } from "use-clipboard-copy";
import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";

type Section = "stats" | "properties" | "data";
type PipelineNodeActionType =
  | "toggleExpandStats"
  | "toggleExpandProperties"
  | "toggleExpandData";
interface PipelineNodeState {
  expandedSections: Section[];
  pinnedSections: Section[];
}

interface PipelineNodeAction {
  type: PipelineNodeActionType;
}

const toggleExpandedSection = (
  state: PipelineNodeState,
  section: Section,
): PipelineNodeState => {
  return {
    ...state,
    expandedSections: state.expandedSections.includes(section)
      ? state.expandedSections.filter((sec) => sec !== section)
      : [...state.pinnedSections, section],
  };
};

const reducer = (
  state: PipelineNodeState,
  action: PipelineNodeAction,
): PipelineNodeState => {
  switch (action.type) {
    case "toggleExpandStats":
      return toggleExpandedSection(state, "stats");
    case "toggleExpandProperties":
      return toggleExpandedSection(state, "properties");
    case "toggleExpandData":
      return toggleExpandedSection(state, "data");
    default:
      return state;
  }
};

type ProcessorNodeAttributes = {
  titleColor: string;
  subtitleColor: string;
  bgColor: string;
  icon: React.ReactElement;
};

const typeIconMap: Record<string, ProcessorNodeAttributes> = {
  Kafka: {
    icon: <SiApachekafka size={28} />,
    bgColor: "",
    titleColor: "",
    subtitleColor: "",
  },
  JSONParser: {
    icon: <SiJavascript size={28} />,
    bgColor: "bg-[#F6BA00]",
    titleColor: "text-white",
    subtitleColor: "text-white",
  },
  FileCSVSink: {
    icon: <Layers size={28} />,
    bgColor: "bg-[#5D32BF]",
    titleColor: "text-white",
    subtitleColor: "text-white",
  },
};

export type NodeData = {
  parentIDs: string[];
  automationServerId: string;
  workspaceId: string;
  type: string;
  name: string;
  kind: string;
  capabilities: string[];
  id: string;
  properties: Record<string, unknown>;
  width?: number;
  height?: number;
};

export function PipelineNode({ data }: { data: NodeData }) {
  const {
    type: nodeType,
    name: nodeName,
    kind: nodeKind,
    id: nodeID,
    capabilities,
    parentIDs,
    properties,
  } = data;

  const router = useRouter();
  const currentPath = usePathname();

  const initialState: PipelineNodeState = {
    expandedSections: [],
    pinnedSections: [],
  };

  const [state, dispatch] = React.useReducer(reducer, initialState);

  const getIconFromType = (type: string): React.ReactElement => {
    return typeIconMap[type]?.icon ?? <Layers size={28} />;
  };

  const getTitleColorFromType = (type: string): string => {
    const titleColor = typeIconMap[type]?.titleColor;
    return titleColor ?? "text-neutral-200";
  };

  const getSubtitleColorFromType = (type: string): string => {
    const subtitleColor = typeIconMap[type]?.subtitleColor;
    return subtitleColor ?? "text-neutral-500";
  };

  const getBgColorFromType = (type: string): string => {
    const bgColor = typeIconMap[type]?.bgColor;
    return bgColor ?? "bg-neutral-950";
  };

  const [settingNextLevel, setSettingNextLevel] =
    React.useState<boolean>(false);

  const pauseStreamRef = React.useRef<boolean>(false);

  const [componentEvents, setComponentEvents] = React.useState<EventResponse[]>(
    [],
  );

  const pipelineEventsRequestTopic = `/automation-servers/${data.automationServerId}/c/${data.workspaceId}${joinIDsWithDelimiter(
    parentIDs,
    "/",
  )}/c/${nodeID}/events/subscribe`;

  const pipelineEventsResponseTopic = `/automation-servers/${data.automationServerId}/c/${data.workspaceId}${joinIDsWithDelimiter(
    parentIDs,
    "/",
  )}/c/${nodeID}/events`;

  type EventResponse = {
    timestamp: number;
    data: unknown;
    count: number;
  };

  const requestMessage = React.useMemo(() => {
    return { count: 5 };
  }, []);

  const { response: event } = useMQTTRequestResponse<EventResponse>({
    requestTopic: pipelineEventsRequestTopic,
    responseTopic: pipelineEventsResponseTopic,
    requestMessage: requestMessage,
  });

  React.useEffect(() => {
    if (event && !pauseStreamRef.current) {
      setComponentEvents((prevEvents) => [...prevEvents, event]);
    }
  }, [event]);

  return (
    <Card className="w-[800px] rounded-sm border border-neutral-200 shadow-md">
      <CardHeader
        className={clsx(
          "rounded-t-sm",
          getBgColorFromType(nodeType),
          getTitleColorFromType(nodeType),
        )}
      >
        <div className="flex justify-between">
          <div className="flex">
            {getIconFromType(nodeType)}
            <div>
              <CardTitle className="ml-2">{nodeName}</CardTitle>
              <CardDescription
                className={clsx(
                  "ml-2 capitalize",
                  getSubtitleColorFromType(nodeType),
                )}
              >
                {nodeKind}
              </CardDescription>
            </div>
          </div>
          {capabilities.includes("has-children") && (
            <div className="flex">
              {
                <button
                  title="Inspect Pipeline"
                  className="hover:cursor-pointer"
                  disabled={settingNextLevel}
                  onClick={() => {
                    if (settingNextLevel) return;

                    router.push(`${currentPath}/${nodeID}`);

                    setSettingNextLevel(true);
                  }}
                >
                  {settingNextLevel ? (
                    <Loader size={24} className="animate-spin" />
                  ) : (
                    <Search size={24} className="" />
                  )}
                </button>
              }
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="r-2 divide-y p-0">
        <CollapsibleSection
          title="Properties"
          icon={<SlidersHorizontal size={18} className="text-neutral-600" />}
          expanded={state.expandedSections.includes("properties")}
          onToggleExpanded={() => dispatch({ type: "toggleExpandProperties" })}
        >
          <div className="space-y-1.5 text-sm">
            {Object.entries(properties).length > 0 ? (
              Object.entries(properties).map(([key, value]) => {
                return (
                  <StatItem
                    key={key}
                    label={key}
                    value={
                      <span className="text-neutral-500">
                        {JSON.stringify(value)}
                      </span>
                    }
                  />
                );
              })
            ) : (
              <div className="font-semibold text-neutral-500">
                No properties found
              </div>
            )}
          </div>
        </CollapsibleSection>
        {capabilities.includes("subscribable-events") && (
          <CollapsibleSection
            title="Data"
            icon={<Braces size={18} className="text-neutral-600" />}
            expanded={state.expandedSections.includes("data")}
            onToggleExpanded={() => dispatch({ type: "toggleExpandData" })}
          >
            <DataSectionBody
              events={componentEvents}
              onPauseEventStream={() => (pauseStreamRef.current = true)}
              onResumeEventStream={() => (pauseStreamRef.current = false)}
            />
          </CollapsibleSection>
        )}
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

export default memo(PipelineNode);

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
      <span className="title font-bold capitalize text-neutral-600">
        {label}:
      </span>
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

type EventResponse = {
  timestamp: number;
  data: unknown;
  count: number;
};

type FormattedEventResponse = {
  timestamp: string;
  data: unknown;
  count: number;
};

interface DataSectionBodyProps {
  events: EventResponse[];
  onPauseEventStream?: () => void;
  onResumeEventStream?: () => void;
}

function DataSectionBody(props: DataSectionBodyProps) {
  const { events, onPauseEventStream, onResumeEventStream } = props;

  const [isPaused, setIsPaused] = React.useState<boolean>(false);

  const handlePause = () => {
    setIsPaused(true);
    onPauseEventStream?.();
  };

  const handleResume = () => {
    setIsPaused(false);
    onResumeEventStream?.();
  };

  const datakeyToCopyRef = React.useRef<string>("");
  const [copied, setCopied] = React.useState<Record<string, boolean>>();

  const clipboard = useClipboard({
    onSuccess() {
      setCopied((prevCopyState) => {
        return {
          ...prevCopyState,
          [datakeyToCopyRef.current]: true,
        };
      });

      setTimeout(() => {
        setCopied((prevCopyState) => {
          return {
            ...prevCopyState,
            [datakeyToCopyRef.current]: false,
          };
        });
      }, 2000);
    },
    onError() {
      handleError(new Error("Failed to copy to clipboard"));
    },
  });

  const handleCopy = (data: unknown, key: string) => {
    datakeyToCopyRef.current = key;
    clipboard.copy(data);
  };

  const [activeTab, setActiveTab] = React.useState<DataSectionTabOptions>(
    DataSectionTabOptions.Input,
  );

  const eventResponseObject: Record<string, unknown> = events
    .map((e) => {
      return {
        ...e,
        timestamp: epochToFormattedTime(e.timestamp),
      } as FormattedEventResponse;
    })
    .reduce(
      (accumulator: Record<string, unknown>, e: FormattedEventResponse) => {
        accumulator[`#${e.count} ${e.timestamp}`] = e.data;
        return accumulator;
      },
      {} as Record<string, unknown>,
    );

  return (
    <div className="w-full pb-8">
      <div className="nodrag flex w-full border-b border-neutral-300">
        <DataSectionTab
          isActive={activeTab === DataSectionTabOptions.Input}
          label="Events"
          onClick={() => setActiveTab(DataSectionTabOptions.Input)}
        />
      </div>
      <div className="nodrag px-2">
        {activeTab === DataSectionTabOptions.Input && (
          <div>
            <div className="my-2">
              {!isPaused ? (
                <Button size={"sm"} onClick={handlePause}>
                  <PauseCircle size={20} className="mr-2" />
                  Pause Stream
                </Button>
              ) : (
                <Button size={"sm"} onClick={handleResume}>
                  <Play size={16} className="mr-2" />
                  Resume Stream
                </Button>
              )}
            </div>
            <div className="nodrag scroll scrollbar h-60 max-h-60 overflow-y-scroll px-2 font-mono text-sm">
              <JSONTree
                hideRoot
                data={eventResponseObject}
                theme={jsonTreeTheme}
                getItemString={(type, data, itemType, itemString, keyPath) => {
                  return (
                    keyPath.length === 1 && (
                      <div className="flex justify-between">
                        {`${
                          JSON.stringify(data).length > 70
                            ? JSON.stringify(data).substring(0, 70) + "..."
                            : JSON.stringify(data)
                        }`}

                        <span>
                          {copied?.[keyPath.join("")] ? (
                            <CheckCheck
                              size={18}
                              className="m-1 mt-2 text-green-600"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <Copy
                              size={14}
                              className="m-1 mt-2"
                              onClick={() =>
                                handleCopy(
                                  JSON.stringify(data),
                                  keyPath.join(""),
                                )
                              }
                            />
                          )}
                        </span>
                      </div>
                    )
                  );
                }}
              />
            </div>
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
