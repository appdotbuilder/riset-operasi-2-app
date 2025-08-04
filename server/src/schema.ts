
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['student', 'lecturer']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Question categories enum
export const questionCategorySchema = z.enum([
  'Pertemuan 1-Pemikiran Sistem',
  'PERTEMUAN 2- ANALISIS JARINGAN',
  'Pertemuan 3-Parameter Analisis Jaringan',
  'Pertemuan 4-Analisis Jaringan Pada Manajemen Proyek',
  'Pertemuan 5- Simulasi Monte Carlo',
  'Game Theory 2xN',
  'Game Theory MxN'
]);
export type QuestionCategory = z.infer<typeof questionCategorySchema>;

// Answer status enum
export const answerStatusSchema = z.enum(['pending', 'auto_scored', 'manually_scored']);
export type AnswerStatus = z.infer<typeof answerStatusSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  role: userRoleSchema,
  name: z.string(),
  nim: z.string().nullable(), // Only for students
  attendance_number: z.number().nullable(), // Only for students
  password_hash: z.string(),
  created_at: z.coerce.date()
});
export type User = z.infer<typeof userSchema>;

// Student registration input
export const studentRegisterInputSchema = z.object({
  name: z.string().min(1),
  nim: z.string().min(1),
  attendance_number: z.number().int().positive(),
  password: z.string().min(6)
});
export type StudentRegisterInput = z.infer<typeof studentRegisterInputSchema>;

// Lecturer registration input
export const lecturerRegisterInputSchema = z.object({
  name: z.string().min(1),
  password: z.string().min(6)
});
export type LecturerRegisterInput = z.infer<typeof lecturerRegisterInputSchema>;

// Login input
export const loginInputSchema = z.object({
  identifier: z.string(), // NIM for students, name for lecturers
  password: z.string()
});
export type LoginInput = z.infer<typeof loginInputSchema>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  category: questionCategorySchema,
  max_score: z.number().positive(),
  keywords: z.array(z.string()).nullable(), // For automatic scoring
  answer_pattern: z.string().nullable(), // For automatic scoring
  created_by: z.number(), // Lecturer ID
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Question = z.infer<typeof questionSchema>;

// Create question input
export const createQuestionInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: questionCategorySchema,
  max_score: z.number().positive(),
  keywords: z.array(z.string()).optional(),
  answer_pattern: z.string().optional(),
  created_by: z.number()
});
export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

// Update question input
export const updateQuestionInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: questionCategorySchema.optional(),
  max_score: z.number().positive().optional(),
  keywords: z.array(z.string()).nullable().optional(),
  answer_pattern: z.string().nullable().optional()
});
export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;

// Answer schema
export const answerSchema = z.object({
  id: z.number(),
  question_id: z.number(),
  student_id: z.number(),
  content: z.string(),
  auto_score: z.number().nullable(),
  manual_score: z.number().nullable(),
  final_score: z.number().nullable(),
  status: answerStatusSchema,
  feedback: z.string().nullable(),
  submitted_at: z.coerce.date(),
  scored_at: z.coerce.date().nullable(),
  scored_by: z.number().nullable() // Lecturer ID who scored manually
});
export type Answer = z.infer<typeof answerSchema>;

// Submit answer input
export const submitAnswerInputSchema = z.object({
  question_id: z.number(),
  student_id: z.number(),
  content: z.string().min(1)
});
export type SubmitAnswerInput = z.infer<typeof submitAnswerInputSchema>;

// Manual scoring input
export const manualScoreInputSchema = z.object({
  answer_id: z.number(),
  manual_score: z.number().min(0),
  feedback: z.string().optional(),
  scored_by: z.number() // Lecturer ID
});
export type ManualScoreInput = z.infer<typeof manualScoreInputSchema>;

// Score summary schema
export const scoreSummarySchema = z.object({
  student_id: z.number(),
  student_name: z.string(),
  nim: z.string(),
  total_questions: z.number(),
  answered_questions: z.number(),
  total_score: z.number(),
  max_possible_score: z.number(),
  percentage: z.number(),
  category_scores: z.array(z.object({
    category: questionCategorySchema,
    score: z.number(),
    max_score: z.number(),
    percentage: z.number()
  }))
});
export type ScoreSummary = z.infer<typeof scoreSummarySchema>;

// Progress report schema
export const progressReportSchema = z.object({
  student_id: z.number(),
  answers: z.array(z.object({
    question_id: z.number(),
    question_title: z.string(),
    category: questionCategorySchema,
    final_score: z.number().nullable(),
    max_score: z.number(),
    status: answerStatusSchema,
    submitted_at: z.coerce.date()
  }))
});
export type ProgressReport = z.infer<typeof progressReportSchema>;
