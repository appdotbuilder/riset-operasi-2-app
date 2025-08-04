
import { db } from '../db';
import { answersTable, questionsTable } from '../db/schema';
import { type SubmitAnswerInput, type Answer } from '../schema';
import { eq } from 'drizzle-orm';

export const submitAnswer = async (input: SubmitAnswerInput): Promise<Answer> => {
  try {
    // First, get the question to check for automatic scoring criteria
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.question_id))
      .execute();

    if (questions.length === 0) {
      throw new Error('Question not found');
    }

    const question = questions[0];
    
    // Calculate automatic score if keywords are available
    let autoScore: number | null = null;
    let status: 'pending' | 'auto_scored' | 'manually_scored' = 'pending';
    
    if (question.keywords && Array.isArray(question.keywords) && question.keywords.length > 0) {
      // Simple keyword matching scoring
      const contentLower = input.content.toLowerCase();
      const matchedKeywords = question.keywords.filter(keyword => 
        contentLower.includes(keyword.toLowerCase())
      );
      
      // Calculate score based on keyword matches (proportional to max_score)
      const keywordScore = (matchedKeywords.length / question.keywords.length) * question.max_score;
      autoScore = Math.round(keywordScore);
      status = 'auto_scored';
    }

    // Calculate final score
    const finalScore = autoScore !== null ? autoScore : null;
    const scoredAt = autoScore !== null ? new Date() : null;

    // Insert the answer
    const result = await db.insert(answersTable)
      .values({
        question_id: input.question_id,
        student_id: input.student_id,
        content: input.content,
        auto_score: autoScore,
        manual_score: null,
        final_score: finalScore,
        status: status,
        feedback: null,
        scored_at: scoredAt,
        scored_by: null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Answer submission failed:', error);
    throw error;
  }
};
