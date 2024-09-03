import { useMQTTRequestResponse } from "@/shared/hooks/mqtt-new";
import {
  type DynamicSidebarItem,
  type DynamicSidebarResponse,
} from "@/types/sidebar";

export const useDynamicSidebar = () => {
  const {
    response: sidebarRes,
    isLoading,
    error,
  } = useMQTTRequestResponse<DynamicSidebarResponse>({
    requestTopic: "/topology/subscribe",
    responseTopic: "/topology",
    requestMessage: {
      count: 1,
    },
  });

  console.log("useDynamicSidebar", sidebarRes);

  const sideBarItems = Object.entries(sidebarRes?.topology ?? {}).reduce(
    (acc, v) => {
      return [...acc, v[1] as DynamicSidebarItem];
    },
    [] as DynamicSidebarItem[],
  );

  return { sideBarItems, isLoading, error };
};
