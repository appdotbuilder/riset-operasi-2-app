
import { db } from '../db';
import { questionsTable, usersTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';

export const createQuestion = async (input: CreateQuestionInput): Promise<Question> => {
  try {
    // Validate that the creator exists and is a lecturer
    const creator = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.created_by))
      .execute();

    if (creator.length === 0) {
      throw new Error('Creator not found');
    }

    if (creator[0].role !== 'lecturer') {
      throw new Error('Only lecturers can create questions');
    }

    // Insert question record
    const result = await db.insert(questionsTable)
      .values({
        title: input.title,
        content: input.content,
        category: input.category,
        max_score: input.max_score,
        keywords: input.keywords || null,
        answer_pattern: input.answer_pattern || null,
        created_by: input.created_by
      })
      .returning()
      .execute();

    const question = result[0];
    return {
      ...question,
      keywords: question.keywords as string[] | null // Type assertion for JSON field
    };
  } catch (error) {
    console.error('Question creation failed:', error);
    throw error;
  }
};
