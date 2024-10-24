"use client";

import type * as FaIcons from "react-icons/fa";

import { type IconSetKey, iconSets } from "../DynamicIcon";
import React, { useMemo, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { type IconType } from "react-icons";
import { Input } from "@/components/ui/input";

interface IconInfo {
  name: string;
  component: IconType;
}

type IconSelectorProps = {
  onSelectIcon: (iconName: string) => void;
  defaultValue?: string;
};

export const IconSelector = ({
  onSelectIcon,
  defaultValue,
}: IconSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<IconInfo | null>(null);

  const allIcons = useMemo<IconInfo[]>(() => {
    return (Object.entries(iconSets) as [IconSetKey, typeof FaIcons][]).flatMap(
      ([, iconSet]) =>
        Object.entries(iconSet).map(([iconName, component]) => ({
          name: iconName,
          component: component as IconType,
        })),
    );
  }, []);

  useEffect(() => {
    if (defaultValue) {
      const initialIcon = allIcons.find((icon) => icon.name === defaultValue);
      if (initialIcon) {
        setSelectedIcon(initialIcon);
      }
    }
  }, [defaultValue, allIcons]);

  const filteredIcons = useMemo(() => {
    return allIcons.filter((icon) =>
      icon.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [allIcons, searchTerm]);

  const handleSelectIcon = (icon: IconInfo) => {
    setSelectedIcon(icon);
    onSelectIcon(icon.name);
  };

  return (
    <div className="py-2">
      <Input
        type="text"
        placeholder="Search icons..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <div className="mb-4 grid grid-cols-6 gap-2">
        {filteredIcons.slice(0, 30).map((icon) => (
          <Button
            type="button"
            key={icon.name}
            onClick={() => handleSelectIcon(icon)}
            className={`p-2 px-1 ${selectedIcon?.name === icon.name ? "bg-blue-500" : "bg-neutral-800"}`}
          >
            <icon.component size={16} />
          </Button>
        ))}
      </div>
      {selectedIcon && (
        <div className="mb-2 mt-4 text-sm">
          <p className="mb-2">
            Selected Icon:{" "}
            <span className=" font-semibold">{selectedIcon.name}</span>{" "}
          </p>
          <selectedIcon.component size={32} />
        </div>
      )}
    </div>
  );
};
