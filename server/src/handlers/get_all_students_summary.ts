
import { db } from '../db';
import { usersTable, questionsTable, answersTable } from '../db/schema';
import { type ScoreSummary } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

export async function getAllStudentsSummary(): Promise<ScoreSummary[]> {
  try {
    // Get all students
    const students = await db.select()
      .from(usersTable)
      .where(eq(usersTable.role, 'student'))
      .execute();

    // Get all questions with their categories and max scores
    const questions = await db.select()
      .from(questionsTable)
      .execute();

    // Get all answers with scores
    const answers = await db.select()
      .from(answersTable)
      .execute();

    const summaries: ScoreSummary[] = students.map(student => {
      // Get student's answers
      const studentAnswers = answers.filter(answer => answer.student_id === student.id);

      // Calculate total questions and answered questions
      const totalQuestions = questions.length;
      const answeredQuestions = studentAnswers.length;

      // Calculate total score and max possible score
      let totalScore = 0;
      const maxPossibleScore = questions.reduce((sum, question) => sum + question.max_score, 0);

      studentAnswers.forEach(answer => {
        if (answer.final_score !== null) {
          totalScore += answer.final_score;
        }
      });

      // Calculate percentage
      const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

      // Calculate category scores
      const categoryScores = questions.reduce((acc, question) => {
        const existingCategory = acc.find(cat => cat.category === question.category);
        
        if (existingCategory) {
          existingCategory.max_score += question.max_score;
        } else {
          acc.push({
            category: question.category,
            score: 0,
            max_score: question.max_score,
            percentage: 0
          });
        }

        return acc;
      }, [] as Array<{ category: string; score: number; max_score: number; percentage: number }>);

      // Add student scores to categories
      studentAnswers.forEach(answer => {
        const question = questions.find(q => q.id === answer.question_id);
        if (question && answer.final_score !== null) {
          const categoryScore = categoryScores.find(cat => cat.category === question.category);
          if (categoryScore) {
            categoryScore.score += answer.final_score;
          }
        }
      });

      // Calculate category percentages
      categoryScores.forEach(categoryScore => {
        categoryScore.percentage = categoryScore.max_score > 0 
          ? (categoryScore.score / categoryScore.max_score) * 100 
          : 0;
      });

      return {
        student_id: student.id,
        student_name: student.name,
        nim: student.nim || '',
        total_questions: totalQuestions,
        answered_questions: answeredQuestions,
        total_score: totalScore,
        max_possible_score: maxPossibleScore,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        category_scores: categoryScores.map(cat => ({
          category: cat.category as any, // Type assertion for enum
          score: cat.score,
          max_score: cat.max_score,
          percentage: Math.round(cat.percentage * 100) / 100 // Round to 2 decimal places
        }))
      };
    });

    return summaries;
  } catch (error) {
    console.error('Get all students summary failed:', error);
    throw error;
  }
}
