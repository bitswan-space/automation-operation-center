import ReactQueryProvider from "@/context/ReactQueryProvider";
import "@/styles/globals.css";
import "reactflow/dist/base.css";

import { GeistSans } from "geist/font/sans";

import { type Metadata } from "next";
import FlowProvider from "@/context/ReactFlowProvider";

export const metadata: Metadata = {
  title: "Bitswan A.O.C",
  description: "Bitswan Automations Operation Center",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReactQueryProvider>
      <FlowProvider>
        <html lang="en" className={`${GeistSans.variable} bg-neutral-200/50`}>
          <body className="">
            <main>{children}</main>
          </body>
        </html>
      </FlowProvider>
    </ReactQueryProvider>
  );
}
