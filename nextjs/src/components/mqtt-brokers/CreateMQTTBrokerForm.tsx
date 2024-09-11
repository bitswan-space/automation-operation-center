import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { HelpCircle, Loader } from "lucide-react";
import { CreateMQTTBrokerSchema } from "@/shared/schema/mqtt-brokers";

export function CreateMQTTBrokerForm() {
  //   create MQTTBroker mutation

  const form = useForm<z.infer<typeof CreateMQTTBrokerSchema>>({
    resolver: zodResolver(CreateMQTTBrokerSchema),
    defaultValues: {
      name: "",
      url: "",
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof CreateMQTTBrokerSchema>) {
    console.log("submitting");
    console.log(values);

    // Call the create MQTTBroker mutation
  }

  const isLoading = false;

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="max-w-4xl space-y-4"
      >
        <div className="flex w-full gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="flex gap-1">
                  Name{" "}
                  <span title="This is the name configured for your MQTT Broker.">
                    <HelpCircle size={15} className="mr-2" />
                  </span>{" "}
                  :
                </FormLabel>
                <FormControl>
                  <Input placeholder="Example Name" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="flex flex-1 gap-1">
                  URL{" "}
                  <span title="This is the url configured for your MQTT Broker.">
                    <HelpCircle size={15} className="mr-2" />
                  </span>{" "}
                  :
                </FormLabel>
                <FormControl>
                  <Input placeholder="mqtt://example.com:1883" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="flex gap-1">
                  Username{" "}
                  <span title="This is the username configured for your MQTT Broker.">
                    <HelpCircle size={15} className="mr-2" />
                  </span>{" "}
                  :
                </FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="flex gap-1">
                  Password{" "}
                  <span title="This is the name configured for your MQTT Broker.">
                    <HelpCircle size={15} className="mr-2" />
                  </span>{" "}
                  :
                </FormLabel>
                <FormControl>
                  <Input placeholder="********" type="password" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          Create MQTT Broker{" "}
          {isLoading && (
            <span>
              <Loader size={20} className="ml-2 animate-spin" />
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
