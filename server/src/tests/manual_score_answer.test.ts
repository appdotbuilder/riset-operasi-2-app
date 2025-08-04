
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, questionsTable, answersTable } from '../db/schema';
import { type ManualScoreInput } from '../schema';
import { manualScoreAnswer } from '../handlers/manual_score_answer';
import { eq } from 'drizzle-orm';

describe('manualScoreAnswer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let lecturerId: number;
  let studentId: number;
  let questionId: number;
  let answerId: number;

  beforeEach(async () => {
    // Create a lecturer
    const lecturer = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Dr. Smith',
        password_hash: 'hashed_password_123'
      })
      .returning()
      .execute();
    lecturerId = lecturer[0].id;

    // Create a student
    const student = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'John Doe',
        nim: '12345678',
        attendance_number: 1,
        password_hash: 'hashed_password_456'
      })
      .returning()
      .execute();
    studentId = student[0].id;

    // Create a question
    const question = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        content: 'What is systems thinking?',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 100,
        created_by: lecturerId
      })
      .returning()
      .execute();
    questionId = question[0].id;

    // Create an answer
    const answer = await db.insert(answersTable)
      .values({
        question_id: questionId,
        student_id: studentId,
        content: 'Systems thinking is a holistic approach to analysis.',
        status: 'pending'
      })
      .returning()
      .execute();
    answerId = answer[0].id;
  });

  it('should manually score an answer', async () => {
    const input: ManualScoreInput = {
      answer_id: answerId,
      manual_score: 85,
      feedback: 'Good understanding but could be more detailed',
      scored_by: lecturerId
    };

    const result = await manualScoreAnswer(input);

    expect(result.id).toEqual(answerId);
    expect(result.manual_score).toEqual(85);
    expect(result.final_score).toEqual(85);
    expect(result.status).toEqual('manually_scored');
    expect(result.feedback).toEqual('Good understanding but could be more detailed');
    expect(result.scored_by).toEqual(lecturerId);
    expect(result.scored_at).toBeInstanceOf(Date);
  });

  it('should save manual score to database', async () => {
    const input: ManualScoreInput = {
      answer_id: answerId,
      manual_score: 90,
      feedback: 'Excellent work',
      scored_by: lecturerId
    };

    await manualScoreAnswer(input);

    const answers = await db.select()
      .from(answersTable)
      .where(eq(answersTable.id, answerId))
      .execute();

    expect(answers).toHaveLength(1);
    expect(answers[0].manual_score).toEqual(90);
    expect(answers[0].final_score).toEqual(90);
    expect(answers[0].status).toEqual('manually_scored');
    expect(answers[0].feedback).toEqual('Excellent work');
    expect(answers[0].scored_by).toEqual(lecturerId);
    expect(answers[0].scored_at).toBeInstanceOf(Date);
  });

  it('should work without feedback', async () => {
    const input: ManualScoreInput = {
      answer_id: answerId,
      manual_score: 75,
      scored_by: lecturerId
    };

    const result = await manualScoreAnswer(input);

    expect(result.manual_score).toEqual(75);
    expect(result.final_score).toEqual(75);
    expect(result.feedback).toBeNull();
    expect(result.status).toEqual('manually_scored');
  });

  it('should throw error when scorer is not found', async () => {
    const input: ManualScoreInput = {
      answer_id: answerId,
      manual_score: 80,
      scored_by: 999999 // Non-existent user ID
    };

    expect(manualScoreAnswer(input)).rejects.toThrow(/scorer not found/i);
  });

  it('should throw error when scorer is not a lecturer', async () => {
    const input: ManualScoreInput = {
      answer_id: answerId,
      manual_score: 80,
      scored_by: studentId // Student trying to score
    };

    expect(manualScoreAnswer(input)).rejects.toThrow(/only lecturers can manually score/i);
  });

  it('should throw error when answer is not found', async () => {
    const input: ManualScoreInput = {
      answer_id: answerId,
      manual_score: 80,
      scored_by: lecturerId
    };

    // Delete the answer to make it non-existent
    await db.delete(answersTable)
      .where(eq(answersTable.id, answerId))
      .execute();

    expect(manualScoreAnswer(input)).rejects.toThrow(/answer not found/i);
  });
});
