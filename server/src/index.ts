
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  studentRegisterInputSchema,
  lecturerRegisterInputSchema,
  loginInputSchema,
  createQuestionInputSchema,
  updateQuestionInputSchema,
  submitAnswerInputSchema,
  manualScoreInputSchema,
  questionCategorySchema
} from './schema';

// Import handlers
import { registerStudent } from './handlers/register_student';
import { registerLecturer } from './handlers/register_lecturer';
import { login } from './handlers/login';
import { createQuestion } from './handlers/create_question';
import { updateQuestion } from './handlers/update_question';
import { getQuestions } from './handlers/get_questions';
import { getQuestionsByCategory } from './handlers/get_questions_by_category';
import { submitAnswer } from './handlers/submit_answer';
import { manualScoreAnswer } from './handlers/manual_score_answer';
import { getStudentAnswers } from './handlers/get_student_answers';
import { getQuestionAnswers } from './handlers/get_question_answers';
import { getScoreSummary } from './handlers/get_score_summary';
import { getProgressReport } from './handlers/get_progress_report';
import { getAllStudentsSummary } from './handlers/get_all_students_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  registerStudent: publicProcedure
    .input(studentRegisterInputSchema)
    .mutation(({ input }) => registerStudent(input)),

  registerLecturer: publicProcedure
    .input(lecturerRegisterInputSchema)
    .mutation(({ input }) => registerLecturer(input)),

  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // Question management routes
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),

  updateQuestion: publicProcedure
    .input(updateQuestionInputSchema)
    .mutation(({ input }) => updateQuestion(input)),

  getQuestions: publicProcedure
    .query(() => getQuestions()),

  getQuestionsByCategory: publicProcedure
    .input(z.object({ category: questionCategorySchema }))
    .query(({ input }) => getQuestionsByCategory(input.category)),

  // Answer management routes
  submitAnswer: publicProcedure
    .input(submitAnswerInputSchema)
    .mutation(({ input }) => submitAnswer(input)),

  manualScoreAnswer: publicProcedure
    .input(manualScoreInputSchema)
    .mutation(({ input }) => manualScoreAnswer(input)),

  getStudentAnswers: publicProcedure
    .input(z.object({ studentId: z.number() }))
    .query(({ input }) => getStudentAnswers(input.studentId)),

  getQuestionAnswers: publicProcedure
    .input(z.object({ questionId: z.number() }))
    .query(({ input }) => getQuestionAnswers(input.questionId)),

  // Reporting routes
  getScoreSummary: publicProcedure
    .input(z.object({ studentId: z.number() }))
    .query(({ input }) => getScoreSummary(input.studentId)),

  getProgressReport: publicProcedure
    .input(z.object({ studentId: z.number() }))
    .query(({ input }) => getProgressReport(input.studentId)),

  getAllStudentsSummary: publicProcedure
    .query(() => getAllStudentsSummary()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
