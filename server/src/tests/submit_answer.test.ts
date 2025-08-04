
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, questionsTable, answersTable } from '../db/schema';
import { type SubmitAnswerInput } from '../schema';
import { submitAnswer } from '../handlers/submit_answer';
import { eq } from 'drizzle-orm';

describe('submitAnswer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let studentId: number;
  let lecturerId: number;
  let questionId: number;
  let questionWithKeywordsId: number;

  beforeEach(async () => {
    // Create test users
    const students = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '123456789',
        attendance_number: 1,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    studentId = students[0].id;

    const lecturers = await db.insert(usersTable)
      .values({
        role: 'lecturer', 
        name: 'Test Lecturer',
        nim: null,
        attendance_number: null,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    lecturerId = lecturers[0].id;

    // Create test questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          title: 'Basic Question',
          content: 'What is systems thinking?',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 10,
          keywords: null,
          answer_pattern: null,
          created_by: lecturerId
        },
        {
          title: 'Question with Keywords',
          content: 'Explain network analysis concepts',
          category: 'PERTEMUAN 2- ANALISIS JARINGAN',
          max_score: 100,
          keywords: ['network', 'analysis', 'system'],
          answer_pattern: null,
          created_by: lecturerId
        }
      ])
      .returning()
      .execute();
    
    questionId = questions[0].id;
    questionWithKeywordsId = questions[1].id;
  });

  const basicInput: SubmitAnswerInput = {
    question_id: 0, // Will be set in tests
    student_id: 0, // Will be set in tests
    content: 'This is my answer to the question'
  };

  it('should submit answer without automatic scoring', async () => {
    const input = {
      ...basicInput,
      question_id: questionId,
      student_id: studentId
    };

    const result = await submitAnswer(input);

    expect(result.question_id).toEqual(questionId);
    expect(result.student_id).toEqual(studentId);
    expect(result.content).toEqual('This is my answer to the question');
    expect(result.auto_score).toBeNull();
    expect(result.manual_score).toBeNull();
    expect(result.final_score).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.feedback).toBeNull();
    expect(result.submitted_at).toBeInstanceOf(Date);
    expect(result.scored_at).toBeNull();
    expect(result.scored_by).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should submit answer with automatic scoring based on keywords', async () => {
    const input = {
      ...basicInput,
      question_id: questionWithKeywordsId,
      student_id: studentId,
      content: 'Network analysis is a system approach to understanding complex relationships'
    };

    const result = await submitAnswer(input);

    expect(result.question_id).toEqual(questionWithKeywordsId);
    expect(result.student_id).toEqual(studentId);
    expect(result.content).toEqual('Network analysis is a system approach to understanding complex relationships');
    expect(result.auto_score).toBeDefined();
    expect(result.auto_score).toBeGreaterThan(0); // Should have some score due to keyword matches
    expect(result.manual_score).toBeNull();
    expect(result.final_score).toEqual(result.auto_score);
    expect(result.status).toEqual('auto_scored');
    expect(result.feedback).toBeNull();
    expect(result.submitted_at).toBeInstanceOf(Date);
    expect(result.scored_at).toBeInstanceOf(Date);
    expect(result.scored_by).toBeNull();
  });

  it('should calculate correct keyword-based score', async () => {
    const input = {
      ...basicInput,
      question_id: questionWithKeywordsId,
      student_id: studentId,
      content: 'This answer contains network and analysis keywords but not the third one'
    };

    const result = await submitAnswer(input);

    // Should match 2 out of 3 keywords: (2/3) * 100 = 67 (rounded)
    expect(result.auto_score).toEqual(67);
    expect(result.final_score).toEqual(67);
    expect(result.status).toEqual('auto_scored');
  });

  it('should save answer to database', async () => {
    const input = {
      ...basicInput,
      question_id: questionId,
      student_id: studentId
    };

    const result = await submitAnswer(input);

    const answers = await db.select()
      .from(answersTable)
      .where(eq(answersTable.id, result.id))
      .execute();

    expect(answers).toHaveLength(1);
    expect(answers[0].content).toEqual('This is my answer to the question');
    expect(answers[0].question_id).toEqual(questionId);
    expect(answers[0].student_id).toEqual(studentId);
  });

  it('should throw error for non-existent question', async () => {
    const input = {
      ...basicInput,
      question_id: 99999,
      student_id: studentId
    };

    expect(submitAnswer(input)).rejects.toThrow(/question not found/i);
  });

  it('should handle empty keywords array', async () => {
    // Create question with empty keywords array
    const emptyKeywordsQuestions = await db.insert(questionsTable)
      .values({
        title: 'Question with Empty Keywords',
        content: 'Test question',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 50,
        keywords: [],
        answer_pattern: null,
        created_by: lecturerId
      })
      .returning()
      .execute();

    const input = {
      ...basicInput,
      question_id: emptyKeywordsQuestions[0].id,
      student_id: studentId
    };

    const result = await submitAnswer(input);

    expect(result.auto_score).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.scored_at).toBeNull();
  });
});
