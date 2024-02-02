import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppInitialProps } from "next/app";
import "@/styles/globals.css";
import "reactflow/dist/base.css";
import { type ReactElement, type ReactNode } from "react";
import { type NextComponentType, type NextPage } from "next";
import { type AppContextType } from "next/dist/shared/lib/utils";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactFlowProvider } from "reactflow";
import React from "react";
import { SideBarContext } from "@/context/sideBarContext";
import { useDynamicSidebar } from "@/shared/hooks/dynamic-sidebar";

const queryClient = new QueryClient();

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsTypeWithLayout<P> = AppInitialProps<P> & {
  Component: NextPageWithLayout;
};

type AppTypeWithLayout<P = object> = NextComponentType<
  AppContextType,
  P,
  AppPropsTypeWithLayout<P>
>;

const MyApp: AppTypeWithLayout<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const dynamicSideBarItems = useDynamicSidebar();

  const getLayout = Component.getLayout ?? ((page: ReactElement) => page);
  const layout = getLayout(<Component {...pageProps} />);

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <SideBarContext.Provider value={dynamicSideBarItems}>
          <ReactFlowProvider>
            {layout}
            <ReactQueryDevtools initialIsOpen={false} />
          </ReactFlowProvider>
        </SideBarContext.Provider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default MyApp;
