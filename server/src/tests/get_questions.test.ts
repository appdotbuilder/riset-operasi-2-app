
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, questionsTable } from '../db/schema';
import { getQuestions } from '../handlers/get_questions';

describe('getQuestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no questions exist', async () => {
    const result = await getQuestions();
    expect(result).toEqual([]);
  });

  it('should fetch all questions', async () => {
    // Create a lecturer first
    const lecturer = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create test questions
    await db.insert(questionsTable)
      .values([
        {
          title: 'Question 1',
          content: 'Content 1',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 10,
          keywords: ['test', 'question'],
          answer_pattern: 'pattern1',
          created_by: lecturer[0].id
        },
        {
          title: 'Question 2', 
          content: 'Content 2',
          category: 'PERTEMUAN 2- ANALISIS JARINGAN',
          max_score: 15,
          keywords: null,
          answer_pattern: null,
          created_by: lecturer[0].id
        }
      ])
      .execute();

    const result = await getQuestions();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Question 1');
    expect(result[0].content).toEqual('Content 1');
    expect(result[0].category).toEqual('Pertemuan 1-Pemikiran Sistem');
    expect(result[0].max_score).toEqual(10);
    expect(result[0].keywords).toEqual(['test', 'question']);
    expect(result[0].answer_pattern).toEqual('pattern1');
    expect(result[0].created_by).toEqual(lecturer[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Question 2');
    expect(result[1].keywords).toBeNull();
    expect(result[1].answer_pattern).toBeNull();
  });

  it('should filter questions by category', async () => {
    // Create a lecturer first
    const lecturer = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create questions with different categories
    await db.insert(questionsTable)
      .values([
        {
          title: 'System Question',
          content: 'System content',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 10,
          created_by: lecturer[0].id
        },
        {
          title: 'Network Question',
          content: 'Network content',
          category: 'PERTEMUAN 2- ANALISIS JARINGAN',
          max_score: 15,
          created_by: lecturer[0].id
        }
      ])
      .execute();

    const result = await getQuestions({ category: 'Pertemuan 1-Pemikiran Sistem' });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('System Question');
    expect(result[0].category).toEqual('Pertemuan 1-Pemikiran Sistem');
  });

  it('should support pagination', async () => {
    // Create a lecturer first
    const lecturer = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create multiple questions
    await db.insert(questionsTable)
      .values([
        {
          title: 'Question 1',
          content: 'Content 1',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 10,
          created_by: lecturer[0].id
        },
        {
          title: 'Question 2',
          content: 'Content 2',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 10,
          created_by: lecturer[0].id
        },
        {
          title: 'Question 3',
          content: 'Content 3',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 10,
          created_by: lecturer[0].id
        }
      ])
      .execute();

    // Test limit
    const limitedResult = await getQuestions({ limit: 2 });
    expect(limitedResult).toHaveLength(2);

    // Test offset
    const offsetResult = await getQuestions({ limit: 2, offset: 1 });
    expect(offsetResult).toHaveLength(2);
    expect(offsetResult[0].title).toEqual('Question 2');
  });

  it('should combine category filter with pagination', async () => {
    // Create a lecturer first
    const lecturer = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create questions with mixed categories
    await db.insert(questionsTable)
      .values([
        {
          title: 'System 1',
          content: 'Content 1',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 10,
          created_by: lecturer[0].id
        },
        {
          title: 'Network 1',
          content: 'Content 2',
          category: 'PERTEMUAN 2- ANALISIS JARINGAN',
          max_score: 10,
          created_by: lecturer[0].id
        },
        {
          title: 'System 2',
          content: 'Content 3',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 10,
          created_by: lecturer[0].id
        }
      ])
      .execute();

    const result = await getQuestions({ 
      category: 'Pertemuan 1-Pemikiran Sistem',
      limit: 1
    });

    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual('Pertemuan 1-Pemikiran Sistem');
  });

  it('should handle questions with null keywords and answer_pattern', async () => {
    // Create a lecturer first
    const lecturer = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create question with null fields
    await db.insert(questionsTable)
      .values({
        title: 'Basic Question',
        content: 'Basic content',
        category: 'Game Theory 2xN',
        max_score: 20,
        keywords: null,
        answer_pattern: null,
        created_by: lecturer[0].id
      })
      .execute();

    const result = await getQuestions();

    expect(result).toHaveLength(1);
    expect(result[0].keywords).toBeNull();
    expect(result[0].answer_pattern).toBeNull();
    expect(result[0].max_score).toEqual(20);
  });
});
