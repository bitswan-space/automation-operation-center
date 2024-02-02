export type DynamicSidebarResponse = {
  // todo: make the response type more specific and consistent
  topology: Record<string, DynamicSidebarItem | string>;
};

export type DynamicSidebarItem = {
  wires: string[];
  properties: {
    name: string;
    icon: {
      type: string;
      src: string;
    };
    link: {
      type: string;
      topic: string;
    };
  };
};
