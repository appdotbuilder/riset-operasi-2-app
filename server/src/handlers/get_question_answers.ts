
import { db } from '../db';
import { answersTable, usersTable } from '../db/schema';
import { type Answer } from '../schema';
import { eq } from 'drizzle-orm';

export async function getQuestionAnswers(questionId: number): Promise<Answer[]> {
  try {
    // Join with users table to get student information
    const results = await db.select({
      id: answersTable.id,
      question_id: answersTable.question_id,
      student_id: answersTable.student_id,
      content: answersTable.content,
      auto_score: answersTable.auto_score,
      manual_score: answersTable.manual_score,
      final_score: answersTable.final_score,
      status: answersTable.status,
      feedback: answersTable.feedback,
      submitted_at: answersTable.submitted_at,
      scored_at: answersTable.scored_at,
      scored_by: answersTable.scored_by
    })
    .from(answersTable)
    .innerJoin(usersTable, eq(answersTable.student_id, usersTable.id))
    .where(eq(answersTable.question_id, questionId))
    .execute();

    return results;
  } catch (error) {
    console.error('Failed to get question answers:', error);
    throw error;
  }
}
