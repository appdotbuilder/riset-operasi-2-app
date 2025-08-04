
import { db } from '../db';
import { answersTable, usersTable } from '../db/schema';
import { type ManualScoreInput, type Answer } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function manualScoreAnswer(input: ManualScoreInput): Promise<Answer> {
  try {
    // Verify that the scorer is a lecturer
    const scorer = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.scored_by))
      .execute();

    if (scorer.length === 0) {
      throw new Error('Scorer not found');
    }

    if (scorer[0].role !== 'lecturer') {
      throw new Error('Only lecturers can manually score answers');
    }

    // Get the current answer to verify it exists
    const existingAnswer = await db.select()
      .from(answersTable)
      .where(eq(answersTable.id, input.answer_id))
      .execute();

    if (existingAnswer.length === 0) {
      throw new Error('Answer not found');
    }

    // Update the answer with manual score
    const result = await db.update(answersTable)
      .set({
        manual_score: input.manual_score,
        final_score: input.manual_score, // Final score becomes manual score
        status: 'manually_scored',
        feedback: input.feedback || null,
        scored_at: new Date(),
        scored_by: input.scored_by
      })
      .where(eq(answersTable.id, input.answer_id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Manual scoring failed:', error);
    throw error;
  }
}
