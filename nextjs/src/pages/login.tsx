import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(100),
});

export default function Home() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // todo: add login logic
    // signIn("login", {
    //   email: values.email,
    //   password: values.password,
    //   callbackUrl: "/dashboard",
    // })
    //   .then((res) => console.log(res))
    //   .catch((err) => console.log(err));

    console.log(values);
    router
      .push("/")
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  }
  return (
    <>
      <div className="pt-50 my-auto h-full min-h-screen w-full bg-slate-50">
        <div className="mx-auto my-auto p-4 md:max-w-2xl md:pt-40">
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className=" text-3xl">Sign-in</CardTitle>
              <CardDescription>Sign in to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void form.handleSubmit(onSubmit)(event);
                  }}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="password"
                            {...field}
                            type="password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size={"lg"} className="w-full">
                    Submit
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
