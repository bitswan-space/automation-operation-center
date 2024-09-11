import {
  CircleDot,
  Dot,
  GripVertical,
  MoreVertical,
  PenLine,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { Badge } from "../ui/badge";
import React from "react";

export function MQTTBrokersList() {
  return (
    <ul className="max-w-4xl space-y-4">
      <MQTTBrokerItem name="Broker-node01" active={true} isDefault />
      <MQTTBrokerItem name="Broker-node02" active={false} />
    </ul>
  );
}

type MQTTBrokerItemProps = {
  name: string;
  active: boolean;
  isDefault?: boolean;
};

function MQTTBrokerItem(props: MQTTBrokerItemProps) {
  const { name, active, isDefault } = props;

  return (
    <li className="flex justify-between gap-4 rounded border border-neutral-200 bg-neutral-100/80 p-2 px-2 shadow-sm">
      <div className="my-auto flex w-full">
        <div className="my-auto mr-4">
          <GripVertical size={20} className="text-neutral-500" />
        </div>
        <div className="my-auto font-mono text-sm font-medium">{name}</div>
        <div>
          <Dot
            size={30}
            className={active ? "text-green-600" : "text-neutral-500"}
          />
        </div>
      </div>

      <div className="flex gap-1">
        {isDefault && (
          <Badge variant={"outline"} className="bg-neutral-50">
            Default
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <MoreVertical size={20} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 text-sm font-medium text-neutral-600">
            {!isDefault && (
              <DropdownMenuItem className="flex justify-between">
                <span>Make Default</span>
                <span>
                  <CircleDot size={16} strokeWidth={2.5} />
                </span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="flex justify-between">
              <span>Delete</span>
              <span>
                <Trash2 size={16} strokeWidth={2.5} />
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex justify-between">
              <span>Edit</span>
              <span>
                <PenLine size={16} strokeWidth={2.5} />
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
