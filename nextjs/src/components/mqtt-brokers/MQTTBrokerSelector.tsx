import { Loader2, Workflow } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { updateMQTTBroker, useMQTTBrokers } from "./hooks/useMQTTBrokers";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Skeleton } from "../ui/skeleton";
import { useActiveMQTTBroker } from "@/context/MQTTBrokerProvider";
import { useSession } from "next-auth/react";

export function MQTTBrokerSelector() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const { data: mqttBrokers } = useMQTTBrokers();

  const activeMQTTBroker = useActiveMQTTBroker();

  const accessToken = session?.access_token;

  const updateMQTTBrokerMutation = useMutation({
    mutationFn: updateMQTTBroker,
    onSuccess: () => {
      console.log("MQTT Broker created");
      queryClient
        .invalidateQueries({
          queryKey: ["mqtt-brokers"],
        })
        .then(() => {
          console.log("Invalidated mqtt-brokers query");
        })
        .catch((error) => {
          console.error("Error invalidating mqtt-brokers query", error);
        });
    },
  });

  const handleActiveMQTTBrokerChange = (brokerId: string) => {
    updateMQTTBrokerMutation.mutate({
      accessToken: accessToken ?? "",
      broker: {
        id: brokerId,
        active: true,
      },
    });
  };

  const isLoading = updateMQTTBrokerMutation.isLoading;

  return (
    <Select
      value={activeMQTTBroker?.id ?? undefined}
      onValueChange={handleActiveMQTTBrokerChange}
    >
      <SelectTrigger className="w-[250px] bg-neutral-100">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 size={20} className="mr-2 animate-spin" />
          ) : (
            <Workflow
              size={20}
              strokeWidth={2.0}
              className="mr-2 text-neutral-600"
            />
          )}
          <SelectValue
            placeholder="Select mqtt broker"
            defaultValue={activeMQTTBroker?.id ?? undefined}
            className="font-medium"
          />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>
            <div>Active mqtt brokers</div>
            {isLoading && <Skeleton className="mt-2 h-10 w-full" />}
            {mqttBrokers?.results?.length === 0 && (
              <div className="mt-2 flex h-16 flex-col items-center justify-center gap-2 rounded border border-dashed">
                <div className="text-center text-sm font-normal text-neutral-500">
                  No mqtt brokers found
                </div>
              </div>
            )}
          </SelectLabel>
          {mqttBrokers?.results?.map((broker) => (
            <SelectItem key={broker.id} value={broker.id}>
              {broker.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
