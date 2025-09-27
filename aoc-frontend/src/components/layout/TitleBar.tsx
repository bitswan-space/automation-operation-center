import { TitleBarContent } from "./TitlebarContent";
import React, { type ReactNode } from "react";

interface TitleBarProps {
  title: ReactNode;
  className?: string;
}

export function TitleBar(props: Readonly<TitleBarProps>) {
  const { title, className } = props;

  return (
    <TitleBarContent
      className={className}
      title={title}
    />
  );
}