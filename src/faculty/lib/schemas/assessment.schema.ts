import { z } from "zod";

const questionTypeEnum = z.enum(["multiple_choice", "true_false", "short_answer"]);
const assessmentTypeEnum = z.enum(["quiz", "midterm", "final", "exam"]);
const assessmentStatusEnum = z.enum(["draft", "published", "closed"]);

const questionDraftSchema = z
  .object({
    prompt: z.string().min(3, "Question must be at least 3 characters"),
    type: questionTypeEnum,
    options: z.array(z.string().min(1, "Option cannot be empty")).optional(),
    correctAnswer: z.string().min(1, "Correct answer is required"),
    points: z.number().int().min(1, "Points must be at least 1").max(100, "Points can't exceed 100"),
    explanation: z.string().optional(),
  })
  .superRefine((q, ctx) => {
    if (q.type === "multiple_choice") {
      if (!q.options || q.options.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Multiple choice questions need at least 2 options",
        });
        return;
      }
      // Reject duplicate option text (case-insensitive)
      const seen = new Set<string>();
      for (const opt of q.options) {
        const k = opt.trim().toLowerCase();
        if (seen.has(k)) {
          ctx.addIssue({
            code: "custom",
            path: ["options"],
            message: "Options must be unique",
          });
          return;
        }
        seen.add(k);
      }
      if (!q.options.includes(q.correctAnswer)) {
        ctx.addIssue({
          code: "custom",
          path: ["correctAnswer"],
          message: "Correct answer must be one of the options",
        });
      }
    } else if (q.type === "true_false") {
      if (q.correctAnswer !== "True" && q.correctAnswer !== "False") {
        ctx.addIssue({
          code: "custom",
          path: ["correctAnswer"],
          message: "Correct answer must be True or False",
        });
      }
    }
  });

export const createAssessmentSchema = z
  .object({
    courseId: z.string().min(1, "Course is required"),
    title: z.string().min(3, "Title must be at least 3 characters"),
    instructions: z.string().min(10, "Instructions must be at least 10 characters"),
    type: assessmentTypeEnum,
    questions: z.array(questionDraftSchema).min(1, "Add at least one question"),
    weight: z
      .number()
      .min(1, "Weight must be at least 1")
      .max(100, "Weight cannot exceed 100"),
    timeLimitMinutes: z
      .number()
      .int()
      .min(1, "Time limit must be at least 1 minute")
      .max(360, "Time limit cannot exceed 6 hours")
      .optional(),
    attemptsAllowed: z
      .number()
      .int()
      .min(1, "Must allow at least 1 attempt")
      .max(10, "Cannot allow more than 10 attempts"),
    opensAt: z.string().min(1, "Open date is required"),
    closesAt: z.string().min(1, "Close date is required"),
  })
  .superRefine((data, ctx) => {
    const opens = new Date(data.opensAt).getTime();
    const closes = new Date(data.closesAt).getTime();
    if (Number.isNaN(opens) || Number.isNaN(closes)) {
      ctx.addIssue({ code: "custom", path: ["opensAt"], message: "Invalid date format" });
      return;
    }
    if (closes <= opens) {
      ctx.addIssue({
        code: "custom",
        path: ["closesAt"],
        message: "Close date must be after the open date",
      });
    }
  });

export type CreateAssessmentFormData = z.infer<typeof createAssessmentSchema>;

export const updateAssessmentSchema = z
  .object({
    title: z.string().min(3).optional(),
    instructions: z.string().min(10).optional(),
    type: assessmentTypeEnum.optional(),
    questions: z.array(questionDraftSchema).min(1).optional(),
    weight: z.number().min(1).max(100).optional(),
    timeLimitMinutes: z.number().int().min(1).max(360).optional(),
    attemptsAllowed: z.number().int().min(1).max(10).optional(),
    opensAt: z.string().min(1).optional(),
    closesAt: z.string().min(1).optional(),
    status: assessmentStatusEnum.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.opensAt && data.closesAt) {
      const opens = new Date(data.opensAt).getTime();
      const closes = new Date(data.closesAt).getTime();
      if (!Number.isNaN(opens) && !Number.isNaN(closes) && closes <= opens) {
        ctx.addIssue({
          code: "custom",
          path: ["closesAt"],
          message: "Close date must be after the open date",
        });
      }
    }
  });

export type UpdateAssessmentFormData = z.infer<typeof updateAssessmentSchema>;

export const submitAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answer: z.string(), // empty string allowed (counts as wrong)
      }),
    )
    .min(1),
});

export type SubmitAttemptFormData = z.infer<typeof submitAttemptSchema>;
