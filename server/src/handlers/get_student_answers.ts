
import { db } from '../db';
import { answersTable, questionsTable } from '../db/schema';
import { type Answer } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getStudentAnswers(studentId: number): Promise<Answer[]> {
  try {
    // Query answers with question details joined
    const results = await db.select()
      .from(answersTable)
      .innerJoin(questionsTable, eq(answersTable.question_id, questionsTable.id))
      .where(eq(answersTable.student_id, studentId))
      .orderBy(desc(answersTable.submitted_at))
      .execute();

    // Map joined results to Answer schema format
    return results.map(result => ({
      id: result.answers.id,
      question_id: result.answers.question_id,
      student_id: result.answers.student_id,
      content: result.answers.content,
      auto_score: result.answers.auto_score,
      manual_score: result.answers.manual_score,
      final_score: result.answers.final_score,
      status: result.answers.status,
      feedback: result.answers.feedback,
      submitted_at: result.answers.submitted_at,
      scored_at: result.answers.scored_at,
      scored_by: result.answers.scored_by
    }));
  } catch (error) {
    console.error('Failed to get student answers:', error);
    throw error;
  }
}
