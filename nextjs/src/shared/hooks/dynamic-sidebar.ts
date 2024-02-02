import {
  type DynamicSidebarItem,
  type DynamicSidebarResponse,
} from "@/types/sidebar";

import React from "react";
import { useMQTTRequestResponseSubscription } from "./mqtt";

export const useDynamicSidebar = () => {
  const [sideBarItems, setSideBarItems] = React.useState<DynamicSidebarItem[]>(
    [],
  );

  useMQTTRequestResponseSubscription<DynamicSidebarResponse>({
    queryKey: "dynamic-sidebar",
    requestResponseTopicHandler: {
      requestTopic: "/topology/subscribe",
      responseTopic: "/topology",
      requestMessageType: "json",
      requestMessage: {
        count: 1,
      },
      onMessageCallback: (response) => {
        const sidbarItems = Object.entries(response.topology).reduce(
          (acc, v) => {
            return [...acc, v[1] as DynamicSidebarItem];
          },
          [] as DynamicSidebarItem[],
        );

        setSideBarItems(sidbarItems);
      },
    },
  });

  return sideBarItems;
};
