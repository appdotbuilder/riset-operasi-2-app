
import { db } from '../db';
import { answersTable, questionsTable, usersTable } from '../db/schema';
import { type ProgressReport } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getProgressReport(studentId: number): Promise<ProgressReport> {
  try {
    // Query answers with question details for the student
    const results = await db.select({
      question_id: answersTable.question_id,
      question_title: questionsTable.title,
      category: questionsTable.category,
      final_score: answersTable.final_score,
      max_score: questionsTable.max_score,
      status: answersTable.status,
      submitted_at: answersTable.submitted_at
    })
    .from(answersTable)
    .innerJoin(questionsTable, eq(answersTable.question_id, questionsTable.id))
    .where(eq(answersTable.student_id, studentId))
    .execute();

    return {
      student_id: studentId,
      answers: results.map(result => ({
        question_id: result.question_id,
        question_title: result.question_title,
        category: result.category,
        final_score: result.final_score,
        max_score: result.max_score,
        status: result.status,
        submitted_at: result.submitted_at
      }))
    };
  } catch (error) {
    console.error('Failed to get progress report:', error);
    throw error;
  }
}
