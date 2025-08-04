
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, usersTable } from '../db/schema';
import { type CreateQuestionInput, type QuestionCategory } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

describe('createQuestion', () => {
  let lecturerId: number;
  let studentId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a lecturer for testing
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    lecturerId = lecturerResult[0].id;

    // Create a student for testing invalid creator scenarios
    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '12345',
        attendance_number: 1,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    studentId = studentResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateQuestionInput = {
    title: 'Test Question',
    content: 'This is a test question about system thinking.',
    category: 'Pertemuan 1-Pemikiran Sistem',
    max_score: 100,
    keywords: ['system', 'thinking', 'analysis'],
    answer_pattern: 'Expected answer pattern',
    created_by: 0 // Will be set in tests
  };

  it('should create a question with all fields', async () => {
    const input = { ...testInput, created_by: lecturerId };
    const result = await createQuestion(input);

    // Basic field validation
    expect(result.title).toEqual('Test Question');
    expect(result.content).toEqual(testInput.content);
    expect(result.category).toEqual('Pertemuan 1-Pemikiran Sistem');
    expect(result.max_score).toEqual(100);
    expect(result.keywords).toEqual(['system', 'thinking', 'analysis']);
    expect(result.answer_pattern).toEqual('Expected answer pattern');
    expect(result.created_by).toEqual(lecturerId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a question without optional fields', async () => {
    const input: CreateQuestionInput = {
      title: 'Simple Question',
      content: 'Basic question content',
      category: 'Game Theory 2xN',
      max_score: 50,
      created_by: lecturerId
    };

    const result = await createQuestion(input);

    expect(result.title).toEqual('Simple Question');
    expect(result.content).toEqual('Basic question content');
    expect(result.category).toEqual('Game Theory 2xN');
    expect(result.max_score).toEqual(50);
    expect(result.keywords).toBeNull();
    expect(result.answer_pattern).toBeNull();
    expect(result.created_by).toEqual(lecturerId);
  });

  it('should save question to database', async () => {
    const input = { ...testInput, created_by: lecturerId };
    const result = await createQuestion(input);

    // Query the database to verify the question was saved
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].title).toEqual('Test Question');
    expect(questions[0].content).toEqual(testInput.content);
    expect(questions[0].category).toEqual('Pertemuan 1-Pemikiran Sistem');
    expect(questions[0].max_score).toEqual(100);
    expect(questions[0].keywords as string[]).toEqual(['system', 'thinking', 'analysis']);
    expect(questions[0].answer_pattern).toEqual('Expected answer pattern');
    expect(questions[0].created_by).toEqual(lecturerId);
    expect(questions[0].created_at).toBeInstanceOf(Date);
    expect(questions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error if creator does not exist', async () => {
    const input = { ...testInput, created_by: 99999 };

    expect(createQuestion(input)).rejects.toThrow(/creator not found/i);
  });

  it('should throw error if creator is not a lecturer', async () => {
    const input = { ...testInput, created_by: studentId };

    expect(createQuestion(input)).rejects.toThrow(/only lecturers can create questions/i);
  });

  it('should handle different question categories', async () => {
    const categories: QuestionCategory[] = [
      'PERTEMUAN 2- ANALISIS JARINGAN',
      'Pertemuan 5- Simulasi Monte Carlo',
      'Game Theory MxN'
    ];

    for (const category of categories) {
      const input = {
        ...testInput,
        created_by: lecturerId,
        category: category,
        title: `Question for ${category}`
      };

      const result = await createQuestion(input);
      expect(result.category).toEqual(category);
      expect(result.title).toEqual(`Question for ${category}`);
    }
  });
});
