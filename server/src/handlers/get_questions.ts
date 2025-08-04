
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type Question, type QuestionCategory } from '../schema';
import { eq } from 'drizzle-orm';

export interface GetQuestionsOptions {
  category?: QuestionCategory;
  limit?: number;
  offset?: number;
}

export async function getQuestions(options: GetQuestionsOptions = {}): Promise<Question[]> {
  try {
    const { category, limit = 50, offset = 0 } = options;

    // Build the complete query at once to avoid TypeScript type issues
    const results = await (() => {
      const baseQuery = db.select().from(questionsTable);
      
      if (category) {
        return baseQuery
          .where(eq(questionsTable.category, category))
          .limit(limit)
          .offset(offset)
          .execute();
      } else {
        return baseQuery
          .limit(limit)
          .offset(offset)
          .execute();
      }
    })();

    // Convert database results to schema format
    return results.map(question => ({
      ...question,
      max_score: question.max_score, // Already a number from integer column
      keywords: question.keywords || null, // Handle null keywords
      created_at: question.created_at,
      updated_at: question.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    throw error;
  }
}
