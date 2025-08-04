
import { serial, text, pgTable, timestamp, integer, pgEnum, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['student', 'lecturer']);

export const questionCategoryEnum = pgEnum('question_category', [
  'Pertemuan 1-Pemikiran Sistem',
  'PERTEMUAN 2- ANALISIS JARINGAN',
  'Pertemuan 3-Parameter Analisis Jaringan',
  'Pertemuan 4-Analisis Jaringan Pada Manajemen Proyek',
  'Pertemuan 5- Simulasi Monte Carlo',
  'Game Theory 2xN',
  'Game Theory MxN'
]);

export const answerStatusEnum = pgEnum('answer_status', ['pending', 'auto_scored', 'manually_scored']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  role: userRoleEnum('role').notNull(),
  name: text('name').notNull(),
  nim: text('nim'), // Nullable - only for students
  attendance_number: integer('attendance_number'), // Nullable - only for students
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Questions table
export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: questionCategoryEnum('category').notNull(),
  max_score: integer('max_score').notNull(),
  keywords: json('keywords').$type<string[]>(), // JSON array of strings
  answer_pattern: text('answer_pattern'), // Nullable
  created_by: integer('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Answers table
export const answersTable = pgTable('answers', {
  id: serial('id').primaryKey(),
  question_id: integer('question_id').notNull(),
  student_id: integer('student_id').notNull(),
  content: text('content').notNull(),
  auto_score: integer('auto_score'), // Nullable
  manual_score: integer('manual_score'), // Nullable
  final_score: integer('final_score'), // Nullable
  status: answerStatusEnum('status').notNull().default('pending'),
  feedback: text('feedback'), // Nullable
  submitted_at: timestamp('submitted_at').defaultNow().notNull(),
  scored_at: timestamp('scored_at'), // Nullable
  scored_by: integer('scored_by'), // Nullable - lecturer who scored manually
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  createdQuestions: many(questionsTable),
  answers: many(answersTable),
  scoredAnswers: many(answersTable, {
    relationName: 'scorer'
  }),
}));

export const questionsRelations = relations(questionsTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [questionsTable.created_by],
    references: [usersTable.id],
  }),
  answers: many(answersTable),
}));

export const answersRelations = relations(answersTable, ({ one }) => ({
  question: one(questionsTable, {
    fields: [answersTable.question_id],
    references: [questionsTable.id],
  }),
  student: one(usersTable, {
    fields: [answersTable.student_id],
    references: [usersTable.id],
  }),
  scorer: one(usersTable, {
    fields: [answersTable.scored_by],
    references: [usersTable.id],
    relationName: 'scorer'
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Question = typeof questionsTable.$inferSelect;
export type NewQuestion = typeof questionsTable.$inferInsert;
export type Answer = typeof answersTable.$inferSelect;
export type NewAnswer = typeof answersTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  questions: questionsTable,
  answers: answersTable
};
