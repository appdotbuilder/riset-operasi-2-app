
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type Question, type QuestionCategory } from '../schema';
import { eq } from 'drizzle-orm';

export const getQuestionsByCategory = async (category: QuestionCategory): Promise<Question[]> => {
  try {
    const results = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.category, category))
      .execute();

    return results.map(question => ({
      ...question,
      keywords: question.keywords || null, // Ensure null for empty arrays
      answer_pattern: question.answer_pattern || null
    }));
  } catch (error) {
    console.error('Failed to fetch questions by category:', error);
    throw error;
  }
};
