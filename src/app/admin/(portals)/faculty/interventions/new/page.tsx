"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FilePlus, Plus, X, Loader2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createInterventionSchema,
  type CreateInterventionFormData,
} from "@/admin/lib/schemas/faculty.schema";
import { useCreateIntervention, useFacultyStudents } from "@/admin/lib/hooks/use-faculty";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { FormField, FormTextarea, FormSelect } from "@/admin/components/shared/forms/form-field";
import { FormSection } from "@/admin/components/shared/forms/form-section";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";

const interventionTypeOptions = [
  { value: "academic_support", label: "Academic Support" },
  { value: "counseling", label: "Counseling" },
  { value: "mentoring", label: "Mentoring" },
  { value: "schedule_adjustment", label: "Schedule Adjustment" },
  { value: "financial_aid", label: "Financial Aid" },
];

function NewInterventionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledStudentId = searchParams.get("studentId") || "";

  const createIntervention = useCreateIntervention();
  const { data: studentsData, isLoading: studentsLoading, isError: studentsError, refetch: refetchStudents } = useFacultyStudents();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useForm<CreateInterventionFormData>({
    resolver: zodResolver(createInterventionSchema),
    defaultValues: {
      studentId: prefilledStudentId,
      type: undefined,
      description: "",
      goals: [""],
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const [goals, setGoals] = useState<string[]>([""]);

  const onSubmit = async (data: CreateInterventionFormData) => {
    const filteredGoals = goals.filter((g) => g.trim().length > 0);
    if (filteredGoals.length === 0) return;

    try {
      await createIntervention.mutateAsync({
        ...data,
        goals: filteredGoals,
      });
      router.push("/faculty/interventions");
    } catch {
      // Error state handled by mutation
    }
  };

  const addGoal = () => {
    setGoals((prev) => [...prev, ""]);
  };

  const removeGoal = (index: number) => {
    if (goals.length === 1) return;
    const updated = goals.filter((_, i) => i !== index);
    setGoals(updated);
    setValue("goals", updated);
  };

  const updateGoal = (index: number, value: string) => {
    const updated = goals.map((g, i) => (i === index ? value : g));
    setGoals(updated);
    setValue("goals", updated);
  };

  if (studentsLoading) return <DashboardSkeleton />;
  if (studentsError) return <ErrorState onRetry={() => refetchStudents()} />;

  const students = studentsData?.students ?? [];
  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.studentId})`,
  }));

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/faculty/interventions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Interventions
      </Link>

      <PageHeader
        icon={FilePlus}
        title="New Intervention"
        description="Create a new student intervention"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <FormSection title="Intervention Details" description="Fill in the details for this intervention">
          <FormSelect
            label="Student"
            required
            options={studentOptions}
            placeholder="Select a student..."
            {...register("studentId")}
            error={errors.studentId?.message}
          />

          <FormSelect
            label="Intervention Type"
            required
            options={interventionTypeOptions}
            placeholder="Select type..."
            {...register("type")}
            error={errors.type?.message}
          />

          <FormTextarea
            label="Description"
            required
            {...register("description")}
            error={errors.description?.message}
            placeholder="Describe the intervention plan in detail (min 20 characters)..."
            rows={4}
          />

          <FormField
            label="Start Date"
            required
            type="date"
            {...register("startDate")}
            error={errors.startDate?.message}
          />
        </FormSection>

        <FormSection title="Goals" description="Define at least one goal for this intervention">
          <div className="space-y-3">
            {goals.map((goal, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateGoal(i, e.target.value)}
                  placeholder={`Goal ${i + 1}`}
                  className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 hover:border-muted-foreground"
                />
                {goals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGoal(i)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-danger-light hover:text-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {errors.goals?.message && (
              <p className="text-xs text-danger">{errors.goals.message}</p>
            )}
            <button
              type="button"
              onClick={addGoal}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-portal-accent hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add goal
            </button>
          </div>
        </FormSection>

        {/* Error feedback */}
        {createIntervention.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger-light/50 px-4 py-3">
            <p className="text-sm text-danger">
              Failed to create intervention. Please try again.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-border pt-6">
          <button
            type="submit"
            disabled={createIntervention.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-6 py-2.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {createIntervention.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Intervention
          </button>
          <Link
            href="/faculty/interventions"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function FacultyNewInterventionPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <NewInterventionForm />
    </Suspense>
  );
}
