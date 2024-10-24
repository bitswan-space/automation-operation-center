import * as AiIcons from "react-icons/ai";
import * as BsIcons from "react-icons/bs";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as FiIcons from "react-icons/fi";
import * as SiIcons from "react-icons/si";
import { type IconBaseProps, type IconType } from "react-icons";

import React from "react";

export const iconSets = {
  Fa: FaIcons,
  Ai: AiIcons,
  Bs: BsIcons,
  Md: MdIcons,
  Fi: FiIcons,
  Si: SiIcons,
};

// Create a type for the icon set keys
export type IconSetKey = keyof typeof iconSets;

// Props interface for the DynamicIcon component
type DynamicIconProps = IconBaseProps;

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  size = 24,
  color = "currentColor",
  title,
}) => {
  // Extract the icon set prefix (first two characters)
  const iconSetKey = name?.substring(0, 2) as IconSetKey;
  const IconSet = iconSets[iconSetKey];

  if (!IconSet) {
    console.warn(`Icon set "${iconSetKey}" not found`);
    return null;
  }

  const IconComponent = IconSet[name as keyof typeof IconSet] as IconType;

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in set "${iconSetKey}"`);
    return null;
  }

  return <IconComponent size={size} color={color} title={title} />;
};
