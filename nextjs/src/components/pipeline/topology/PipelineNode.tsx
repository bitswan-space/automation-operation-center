import {
  BarChartBig,
  Braces,
  CheckCheck,
  ChevronRight,
  Copy,
  Layers,
  PauseCircle,
  Play,
  SlidersHorizontal,
  View,
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
import { Handle, type NodeProps, Position } from "reactflow";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JSONTree } from "react-json-tree";
import React from "react";
import clsx from "clsx";
import { memo } from "react";
import { SiApachekafka, SiJavascript } from "react-icons/si";
import { jsonTreeTheme, outputSampleJSON } from "@/utils/jsonTree";
import { useRouter } from "next/router";
import { useMQTTRequestResponseSubscription } from "@/shared/hooks/mqtt";
import { joinIDsWithDelimiter } from "@/utils/pipelineUtils";
import { epochToFormattedTime } from "@/utils/time";
import { useClipboard } from "use-clipboard-copy";

type Section = "stats" | "configure" | "data" | "logs";
type PipelineNodeActionType =
  | "toggleExpandStats"
  | "toggleExpandConfigure"
  | "toggleExpandData"
  | "toggleExpandLogs"
  | "togglePinStats"
  | "togglePinConfigure"
  | "togglePinData"
  | "togglePinLogs";
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
  type: string;
  name: string;
  kind: string;
  capabilities: string[];
  id: string;
};

export function PipelineNode({ data }: NodeProps<NodeData>) {
  const {
    type: nodeType,
    name: nodeName,
    kind: nodeKind,
    id: nodeID,
    capabilities,
    parentIDs,
  } = data;

  const router = useRouter();
  const currentPath = router.asPath;

  const initialState: PipelineNodeState = {
    expandedSections: [],
    pinnedSections: [],
  };

  const [state, dispatch] = React.useReducer<
    (state: PipelineNodeState, action: PipelineNodeAction) => PipelineNodeState
  >(reducer, initialState);

  const getIconFromType = (type: string): React.ReactElement => {
    return typeIconMap[type]?.icon ?? <Layers size={28} />;
  };

  const getTitleColorFromType = (type: string): string => {
    const titleColor = typeIconMap[type]?.titleColor;
    return titleColor ? titleColor : "text-neutral-200";
  };

  const getSubtitleColorFromType = (type: string): string => {
    const subtitleColor = typeIconMap[type]?.subtitleColor;
    return subtitleColor ? subtitleColor : "text-neutral-500";
  };

  const getBgColorFromType = (type: string): string => {
    const bgColor = typeIconMap[type]?.bgColor;
    return bgColor ? bgColor : "bg-neutral-950";
  };

  const pauseStreamRef = React.useRef<boolean>(false);

  const [componentEvents, setComponentEvents] = React.useState<EventResponse[]>(
    [],
  );

  const pipelineEventsRequestTopic = `${joinIDsWithDelimiter(
    parentIDs,
    "/",
  )}/c/${nodeID}/events/subscribe`;

  const pipelineEventsResponseTopic = `${joinIDsWithDelimiter(
    parentIDs,
    "/",
  )}/c/${nodeID}/events`;

  type EventResponse = {
    timestamp: number;
    data: unknown;
    event_number: number;
  };

  useMQTTRequestResponseSubscription<EventResponse>({
    queryKey: "events-subscription",
    requestResponseTopicHandler: {
      requestTopic: pipelineEventsRequestTopic,
      responseTopic: pipelineEventsResponseTopic,
      requestMessageType: "json",
      requestMessage: { event_count: 200 },
      onMessageCallback: (response) => {
        if (!pauseStreamRef.current) {
          setComponentEvents((events) => [response, ...events]);
        }
      },
    },
    infiniteSubscription: true,
    enabled: nodeType === "component",
  });

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
                <div
                  title="Inspect Pipeline"
                  className="hover:cursor-pointer"
                  onClick={() => {
                    router
                      .push(`${currentPath}/${nodeID}`)
                      .then(() => {
                        // window.location.reload()
                      })
                      .catch((err) => console.log(err));
                  }}
                >
                  <View size={24} className="" />
                </div>
              }
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="r-2 divide-y p-0">
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

type EventResponse = {
  timestamp: number;
  data: unknown;
  event_number: number;
};

type FormattedEventResponse = {
  timestamp: string;
  data: unknown;
  event_number: number;
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
      console.log("error");
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
        accumulator[`#${e.event_number} ${e.timestamp}`] = e.data;
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
