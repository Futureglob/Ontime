
        import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import profileService from "@/services/profileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Profile } from "@/types/database";

const profileFormSchema = z.object({
  full_name: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  mobile_number: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSettings() {
  const { user, currentProfile, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
      mobile_number: "",
    },
  });

  useEffect(() => {
    if (currentProfile) {
      form.reset({
        full_name: currentProfile.full_name || "",
        mobile_number: currentProfile.mobile_number || "",
      });
    }
  }, [currentProfile, form]);

  async function onSubmit( ProfileFormValues) {
    if (!currentProfile) return;

    setIsSubmitting(true);
    try {
      const updates: Partial<Profile> = {
        full_name: data.full_name,
        mobile_number: data.mobile_number,
        updated_at: new Date().toISOString(),
      };
      
      await profileService.updateProfile(currentProfile.id, updates);

      await refreshProfile();

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error updating profile",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your personal information here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Your phone number" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
      