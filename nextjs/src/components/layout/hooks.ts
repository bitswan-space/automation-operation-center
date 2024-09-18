import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";
import {
  type DynamicSidebarItem,
  type DynamicSidebarResponse,
} from "@/types/sidebar";

export const useDynamicSidebar = () => {
  const { response: sidebarRes } =
    useMQTTRequestResponse<DynamicSidebarResponse>({
      requestTopic: "/topology/subscribe",
      responseTopic: "/topology",
    });

  const sideBarItems = Object.entries(sidebarRes?.topology ?? {}).reduce(
    (acc, v) => {
      return [...acc, v[1] as DynamicSidebarItem];
    },
    [] as DynamicSidebarItem[],
  );

  return { sideBarItems };
};
