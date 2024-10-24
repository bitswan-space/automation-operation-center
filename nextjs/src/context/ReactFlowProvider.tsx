"use client";

import { type ReactNode } from "react";

import { ReactFlowProvider } from "reactflow";

export default function FlowProvider({ children }: { children: ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}
