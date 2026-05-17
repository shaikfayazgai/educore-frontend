"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FilePlus, ArrowLeft, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCourses, useCreateAppeal } from "@/admin/lib/hooks/use-student";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { FormTextarea, FormSelect } from "@/admin/components/shared/forms/form-field";
import { FormSection } from "@/admin/components/shared/forms/form-section";
import { FileUpload } from "@/admin/components/shared/forms/file-upload";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { cn } from "@/admin/lib/utils/cn";

const appealSchema = z.object({
  courseId: z.string().min(1, "Please select a course"),
  assessmentId: z.string().min(1, "Please select an assessment"),
  reason: z.string().min(50, "Reason must be at least 50 characters"),
});

type AppealFormData = z.infer<typeof appealSchema>;

export default function StudentNewAppealPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <StudentNewAppealForm />
    </Suspense>
  );
}

function StudentNewAppealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillCourseId = searchParams.get("courseId") ?? "";
  const prefillAssessmentId = searchParams.get("assessmentId") ?? "";

  const { data: coursesData, isLoading: coursesLoading, isError: coursesError, refetch: refetchCourses } = useCourses();
  const createAppeal = useCreateAppeal();
  const [files, setFiles] = useState<File[]>([]);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppealFormData>({
    defaultValues: {
      courseId: prefillCourseId,
      assessmentId: prefillAssessmentId,
      reason: "",
    },
  });

  // When courses load and we have prefill params, ensure values are set
  useEffect(() => {
    if (prefillCourseId && coursesData) {
      setValue("courseId", prefillCourseId);
      if (prefillAssessmentId) {
        setValue("assessmentId", prefillAssessmentId);
      }
    }
  }, [prefillCourseId, prefillAssessmentId, coursesData, setValue]);

  const selectedCourseId = watch("courseId");
  const reason = watch("reason");

  const courses = coursesData?.courses ?? [];
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const assignments = selectedCourse?.assignments ?? [];

  const courseOptions = courses.map((c) => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
  }));

  const assessmentOptions = assignments.map((a) => ({
    value: a.id,
    label: `${a.title} (${a.type})`,
  }));

  const onSubmit = async (data: AppealFormData) => {
    await createAppeal.mutateAsync({
      courseId: data.courseId,
      assessmentId: data.assessmentId,
      reason: data.reason,
    });
    router.push("/student/appeals");
  };

  const handleFilesChange = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
  }, []);

  if (coursesLoading) return <DashboardSkeleton />;
  if (coursesError) return <ErrorState onRetry={() => refetchCourses()} />;

  return (
    <div className="space-y-6">
      <Link
        href="/student/appeals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Appeals
      </Link>

      <PageHeader
        icon={FilePlus}
        title="New Appeal"
        description="Submit a grade appeal for review"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {/* Appeal Guidelines */}
        <div className="rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setGuidelinesOpen((prev) => !prev)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50"
          >
            <Info className="h-4 w-4 text-info" />
            Appeal Guidelines
            {guidelinesOpen ? (
              <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {guidelinesOpen && (
            <div className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              <p>You may appeal a grade if:</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>There was a calculation error</li>
                <li>The grading criteria was not applied consistently</li>
                <li>There were extenuating circumstances affecting your performance</li>
                <li>You have new evidence not previously considered</li>
              </ol>
              <p className="mt-3">
                Appeals must be submitted within 14 days of the grade being posted.
                The review process typically takes 5-10 business days.
              </p>
            </div>
          )}
        </div>

        {/* Section 1: Course and Assessment */}
        <FormSection
          title="Course & Assessment"
          description="Select the course and assessment you want to appeal"
        >
          <FormSelect
            label="Course"
            required
            options={courseOptions}
            placeholder="Select a course..."
            {...register("courseId", { required: "Please select a course" })}
            error={errors.courseId?.message}
          />

          <FormSelect
            label="Assessment"
            required
            options={assessmentOptions}
            placeholder={selectedCourseId ? "Select an assessment..." : "Select a course first"}
            disabled={!selectedCourseId}
            {...register("assessmentId", { required: "Please select an assessment" })}
            error={errors.assessmentId?.message}
          />

          {selectedCourse && selectedCourseId && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Selected course: <span className="font-medium text-foreground">{selectedCourse.code} - {selectedCourse.name}</span>
                {" "}({selectedCourse.instructor})
              </p>
            </div>
          )}
        </FormSection>

        {/* Section 2: Reason */}
        <FormSection
          title="Appeal Reason"
          description="Provide a detailed explanation for your appeal (minimum 50 characters)"
        >
          <FormTextarea
            label="Reason"
            required
            placeholder="Explain why you believe the assessment score should be reconsidered. Include specific details about the situation, any extenuating circumstances, and what outcome you are requesting..."
            rows={6}
            {...register("reason", {
              required: "Reason is required",
              minLength: {
                value: 50,
                message: "Reason must be at least 50 characters",
              },
            })}
            error={errors.reason?.message}
            hint={`${reason?.length || 0}/50 characters minimum`}
          />
        </FormSection>

        {/* Section 3: Supporting Documents */}
        <FormSection
          title="Supporting Documents"
          description="Upload any documents that support your appeal (optional)"
        >
          <FileUpload
            label="Upload files"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            multiple
            maxSize={10}
            onFilesChange={handleFilesChange}
          />
        </FormSection>

        {/* Error display */}
        {createAppeal.isError && (
          <div className="rounded-lg border border-danger/20 bg-danger-light/50 p-4">
            <p className="text-sm text-danger">
              Failed to submit appeal. Please try again.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-border pt-6">
          <button
            type="submit"
            disabled={createAppeal.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-6 py-2.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {createAppeal.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Appeal
          </button>
          <Link
            href="/student/appeals"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
