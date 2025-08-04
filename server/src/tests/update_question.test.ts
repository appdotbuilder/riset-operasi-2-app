
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, questionsTable } from '../db/schema';
import { type UpdateQuestionInput } from '../schema';
import { updateQuestion } from '../handlers/update_question';
import { eq } from 'drizzle-orm';

// Test data
const testLecturer = {
  role: 'lecturer' as const,
  name: 'Test Lecturer',
  nim: null,
  attendance_number: null,
  password_hash: 'hashed_password'
};

const testQuestion = {
  title: 'Original Question',
  content: 'Original content',
  category: 'Pertemuan 1-Pemikiran Sistem' as const,
  max_score: 100,
  keywords: ['test', 'original'],
  answer_pattern: 'original pattern',
  created_by: 1
};

describe('updateQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a question with all fields', async () => {
    // Create lecturer
    await db.insert(usersTable).values(testLecturer).execute();

    // Create original question
    const [createdQuestion] = await db.insert(questionsTable)
      .values(testQuestion)
      .returning()
      .execute();

    const updateInput: UpdateQuestionInput = {
      id: createdQuestion.id,
      title: 'Updated Question Title',
      content: 'Updated question content',
      category: 'Game Theory 2xN',
      max_score: 150,
      keywords: ['updated', 'keywords'],
      answer_pattern: 'updated pattern'
    };

    const result = await updateQuestion(updateInput);

    expect(result.id).toEqual(createdQuestion.id);
    expect(result.title).toEqual('Updated Question Title');
    expect(result.content).toEqual('Updated question content');
    expect(result.category).toEqual('Game Theory 2xN');
    expect(result.max_score).toEqual(150);
    expect(result.keywords).toEqual(['updated', 'keywords']);
    expect(result.answer_pattern).toEqual('updated pattern');
    expect(result.created_by).toEqual(1);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create lecturer
    await db.insert(usersTable).values(testLecturer).execute();

    // Create original question
    const [createdQuestion] = await db.insert(questionsTable)
      .values(testQuestion)
      .returning()
      .execute();

    const updateInput: UpdateQuestionInput = {
      id: createdQuestion.id,
      title: 'Partially Updated Title',
      max_score: 200
    };

    const result = await updateQuestion(updateInput);

    // Updated fields
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.max_score).toEqual(200);

    // Unchanged fields
    expect(result.content).toEqual('Original content');
    expect(result.category).toEqual('Pertemuan 1-Pemikiran Sistem');
    expect(result.keywords).toEqual(['test', 'original']);
    expect(result.answer_pattern).toEqual('original pattern');
    expect(result.created_by).toEqual(1);
  });

  it('should update question in database', async () => {
    // Create lecturer
    await db.insert(usersTable).values(testLecturer).execute();

    // Create original question
    const [createdQuestion] = await db.insert(questionsTable)
      .values(testQuestion)
      .returning()
      .execute();

    const updateInput: UpdateQuestionInput = {
      id: createdQuestion.id,
      title: 'Database Updated Title',
      content: 'Database updated content'
    };

    await updateQuestion(updateInput);

    // Verify changes in database
    const [updatedQuestion] = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, createdQuestion.id))
      .execute();

    expect(updatedQuestion.title).toEqual('Database Updated Title');
    expect(updatedQuestion.content).toEqual('Database updated content');
    expect(updatedQuestion.max_score).toEqual(100); // Unchanged
    expect(updatedQuestion.updated_at).toBeInstanceOf(Date);
  });

  it('should set nullable fields to null when explicitly provided', async () => {
    // Create lecturer
    await db.insert(usersTable).values(testLecturer).execute();

    // Create original question
    const [createdQuestion] = await db.insert(questionsTable)
      .values(testQuestion)
      .returning()
      .execute();

    const updateInput: UpdateQuestionInput = {
      id: createdQuestion.id,
      keywords: null,
      answer_pattern: null
    };

    const result = await updateQuestion(updateInput);

    expect(result.keywords).toBeNull();
    expect(result.answer_pattern).toBeNull();
    expect(result.title).toEqual('Original Question'); // Unchanged
  });

  it('should throw error when question does not exist', async () => {
    const updateInput: UpdateQuestionInput = {
      id: 999,
      title: 'Non-existent Question'
    };

    expect(updateQuestion(updateInput)).rejects.toThrow(/question not found/i);
  });

  it('should update timestamps correctly', async () => {
    // Create lecturer
    await db.insert(usersTable).values(testLecturer).execute();

    // Create original question
    const [createdQuestion] = await db.insert(questionsTable)
      .values(testQuestion)
      .returning()
      .execute();

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateQuestionInput = {
      id: createdQuestion.id,
      title: 'Timestamp Test'
    };

    const result = await updateQuestion(updateInput);

    expect(result.created_at).toEqual(createdQuestion.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdQuestion.updated_at).toBe(true);
  });
});
