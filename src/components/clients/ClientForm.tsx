import { useForm } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import * as z from "zod";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import {
      Form,
      FormControl,
      FormField,
      FormItem,
      FormLabel,
      FormMessage,
    } from "@/components/ui/form";
    import { clientService, Client, ClientInsert, ClientUpdate } from "@/services/clientService";
    import { useAuth } from "@/contexts/AuthContext";
    import { useToast } from "@/hooks/use-toast";

    const formSchema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters."),
      contact_person: z.string().optional(),
      phone: z.string().optional(),
      place: z.string().optional(),
      emirate: z.string().optional(),
      latitude: z.coerce.number().optional(),
      longitude: z.coerce.number().optional(),
    });

    interface ClientFormProps {
      client?: Client | null;
      onSuccess: () => void;
      onCancel: () => void;
    }

    export default function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
      const { currentProfile } = useAuth();
      const { toast } = useToast();
      const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          name: client?.name || "",
          contact_person: client?.contact_person || "",
          phone: client?.phone || "",
          place: client?.place || "",
          emirate: client?.emirate || "",
          latitude: client?.latitude || undefined,
          longitude: client?.longitude || undefined,
        },
      });

      async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!currentProfile?.organization_id) {
          toast({ title: "Error", description: "No organization found.", variant: "destructive" });
          return;
        }

        try {
          if (client) {
            const updateData: ClientUpdate = { ...values, id: client.id };
            await clientService.updateClient(client.id, updateData);
            toast({ title: "Success", description: "Client updated successfully." });
          } else {
            const insertData: ClientInsert = { ...values, name: values.name, organization_id: currentProfile.organization_id };
            await clientService.createClient(insertData);
            toast({ title: "Success", description: "Client created successfully." });
          }
          onSuccess();
        } catch (err) {
          const error = err as Error;
          toast({ title: "Error", description: error.message || "Could not save client.", variant: "destructive" });
        }
      }

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Client Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+971..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="place"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place</FormLabel>
                  <FormControl>
                    <Input placeholder="Business Bay" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emirate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emirate</FormLabel>
                  <FormControl>
                    <Input placeholder="Dubai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25.1972" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="55.2744" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button type="submit">Save Client</Button>
            </div>
          </form>
        </Form>
      );
    }
  
