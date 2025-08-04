
import { db } from '../db';
import { usersTable, questionsTable, answersTable } from '../db/schema';
import { type ScoreSummary, type QuestionCategory } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function getScoreSummary(studentId: number): Promise<ScoreSummary> {
  try {
    // Get student information
    const student = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, studentId))
      .execute();

    if (student.length === 0) {
      throw new Error('Student not found');
    }

    const studentData = student[0];

    // Get all questions to calculate max possible score
    const allQuestions = await db.select()
      .from(questionsTable)
      .execute();

    // Get student's answered questions with scores
    const answeredQuestions = await db.select({
      question_id: answersTable.question_id,
      final_score: answersTable.final_score,
      category: questionsTable.category,
      max_score: questionsTable.max_score
    })
    .from(answersTable)
    .innerJoin(questionsTable, eq(answersTable.question_id, questionsTable.id))
    .where(eq(answersTable.student_id, studentId))
    .execute();

    // Calculate total scores
    const totalQuestions = allQuestions.length;
    const answeredQuestionsCount = answeredQuestions.length;
    const maxPossibleScore = allQuestions.reduce((sum, q) => sum + q.max_score, 0);
    const totalScore = answeredQuestions.reduce((sum, a) => sum + (a.final_score || 0), 0);
    const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 10000) / 100 : 0;

    // Calculate category scores
    const categoryScores = new Map<QuestionCategory, { score: number; maxScore: number }>();

    // Initialize all categories with 0 scores
    const allCategories: QuestionCategory[] = [
      'Pertemuan 1-Pemikiran Sistem',
      'PERTEMUAN 2- ANALISIS JARINGAN',
      'Pertemuan 3-Parameter Analisis Jaringan',
      'Pertemuan 4-Analisis Jaringan Pada Manajemen Proyek',
      'Pertemuan 5- Simulasi Monte Carlo',
      'Game Theory 2xN',
      'Game Theory MxN'
    ];

    allCategories.forEach(category => {
      categoryScores.set(category, { score: 0, maxScore: 0 });
    });

    // Calculate max scores per category from all questions
    allQuestions.forEach(question => {
      const current = categoryScores.get(question.category as QuestionCategory);
      if (current) {
        current.maxScore += question.max_score;
      }
    });

    // Add actual scores from answered questions
    answeredQuestions.forEach(answer => {
      const current = categoryScores.get(answer.category as QuestionCategory);
      if (current) {
        current.score += answer.final_score || 0;
      }
    });

    // Convert category scores to array format
    const categoryScoresArray = Array.from(categoryScores.entries()).map(([category, scores]) => ({
      category,
      score: scores.score,
      max_score: scores.maxScore,
      percentage: scores.maxScore > 0 ? Math.round((scores.score / scores.maxScore) * 10000) / 100 : 0
    }));

    return {
      student_id: studentId,
      student_name: studentData.name,
      nim: studentData.nim || '',
      total_questions: totalQuestions,
      answered_questions: answeredQuestionsCount,
      total_score: totalScore,
      max_possible_score: maxPossibleScore,
      percentage: percentage,
      category_scores: categoryScoresArray
    };
  } catch (error) {
    console.error('Score summary calculation failed:', error);
    throw error;
  }
}
