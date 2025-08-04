
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type UpdateQuestionInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';

export const updateQuestion = async (input: UpdateQuestionInput): Promise<Question> => {
  try {
    // First check if question exists
    const existingQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .execute();

    if (existingQuestion.length === 0) {
      throw new Error('Question not found');
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.max_score !== undefined) {
      updateData.max_score = input.max_score;
    }
    if (input.keywords !== undefined) {
      updateData.keywords = input.keywords;
    }
    if (input.answer_pattern !== undefined) {
      updateData.answer_pattern = input.answer_pattern;
    }

    // Update the question
    const result = await db.update(questionsTable)
      .set(updateData)
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Question update failed:', error);
    throw error;
  }
};
