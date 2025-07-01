import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Profile } from "@/types/database";

const formSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  employee_id: z.string().min(1, "Employee ID is required"),
  role: z.enum(["admin", "manager", "employee"]),
  designation: z.string().optional(),
  mobile_number: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof formSchema>;

export interface EmployeeFormProps {
  employee?: Profile;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function EmployeeForm({ employee, onSubmit, onCancel, isSubmitting }: EmployeeFormProps) {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      employee_id: "",
      role: "employee",
      designation: "",
      mobile_number: "",
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        full_name: employee.full_name || "",
        email: "",
        employee_id: employee.employee_id || "",
        role: employee.role as "admin" | "manager" | "employee" || "employee",
        designation: employee.designation || "",
        mobile_number: employee.mobile_number || "",
      });
    }
  }, [employee, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" {...register("full_name")} />
        {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} disabled={!!employee} />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        {!!employee && <p className="text-xs text-muted-foreground mt-1">Email cannot be changed after creation.</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input id="employeeId" {...register("employee_id")} />
          {errors.employee_id && <p className="text-red-500 text-sm mt-1">{errors.employee_id.message}</p>}
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="designation">Designation</Label>
          <Input id="designation" {...register("designation")} />
        </div>
        <div>
          <Label htmlFor="mobileNumber">Mobile Number</Label>
          <Input id="mobileNumber" {...register("mobile_number")} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Employee"}
        </Button>
      </div>
    </form>
  );
}
