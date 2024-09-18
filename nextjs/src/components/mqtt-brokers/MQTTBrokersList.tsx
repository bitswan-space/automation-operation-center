import {
  AlertOctagon,
  CircleDot,
  Dot,
  GripVertical,
  Loader,
  MoreVertical,
  PenLine,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import React, { type ReactNode } from "react";

import { Badge } from "../ui/badge";
import { deleteMQTTBroker, useMQTTBrokers } from "./hooks/useMQTTBrokers";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function MQTTBrokersList() {
  const { data: mqttBrokers, isLoading, isError } = useMQTTBrokers();

  if (isError) {
    return (
      <div className="max-w-4xl">
        <MessageBox
          icon={<XCircle size={40} className="mx-auto" />}
          message={"Error fetching MQTT Brokers"}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl">
        <MessageBox
          icon={<Loader size={40} className="mx-auto animate-spin" />}
          message={"Loading MQTT Brokers ..."}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      {mqttBrokers?.results?.length === 0 ? (
        <MessageBox
          icon={<AlertOctagon size={40} className="mx-auto" />}
          message={"No MQTT Brokers configured"}
        />
      ) : (
        <ul className="space-y-4">
          {mqttBrokers?.results?.map((broker) => (
            <MQTTBrokerItem
              id={broker.id}
              key={broker.id}
              name={broker.name}
              active={false}
              isDefault={broker.active}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

type MQTTBrokerItemProps = {
  name: string;
  active: boolean;
  isDefault?: boolean;
  id: string;
};

function MQTTBrokerItem(props: MQTTBrokerItemProps) {
  const { name, active, isDefault, id } = props;

  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const accessToken = session?.access_token ?? "";

  const invalidateMQTTBrokersQuery = () => {
    queryClient
      .invalidateQueries({
        queryKey: ["gitops"],
      })
      .then(() => {
        console.log("Invalidated gitops query");
      })
      .catch((error) => {
        console.error("Error invalidating gitops query", error);
      });
  };
  const deleteMQTTBrokerMutation = useMutation({
    mutationFn: deleteMQTTBroker,
    onSuccess: () => {
      console.log("Gitops created");
      invalidateMQTTBrokersQuery();
    },
  });

  const handleDeleteClick = () => {
    deleteMQTTBrokerMutation.mutate({
      apiToken: accessToken,
      id: id,
    });
  };

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
            <DropdownMenuItem
              className="flex justify-between"
              onClick={handleDeleteClick}
            >
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

type MessageBoxProps = {
  message: ReactNode;
  icon: ReactNode;
};

function MessageBox(props: MessageBoxProps) {
  const { message, icon } = props;

  return (
    <div className="flex h-60 items-center justify-center rounded border border-neutral-200 bg-neutral-100 p-4 text-center">
      <div className="space-y-2 text-neutral-500">
        <div className="mx-auto">{icon}</div>
        <div className="font-mono text-sm">{message}</div>
      </div>
    </div>
  );
}
