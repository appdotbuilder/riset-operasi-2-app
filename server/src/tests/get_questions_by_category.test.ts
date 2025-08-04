
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, questionsTable } from '../db/schema';
import { type QuestionCategory } from '../schema';
import { getQuestionsByCategory } from '../handlers/get_questions_by_category';

describe('getQuestionsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return questions for a specific category', async () => {
    // Create lecturer first
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const lecturerId = lecturerResult[0].id;

    // Create questions in different categories
    await db.insert(questionsTable)
      .values([
        {
          title: 'Question 1',
          content: 'Content for question 1',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 10,
          created_by: lecturerId
        },
        {
          title: 'Question 2',
          content: 'Content for question 2',
          category: 'PERTEMUAN 2- ANALISIS JARINGAN',
          max_score: 15,
          created_by: lecturerId
        },
        {
          title: 'Question 3',
          content: 'Content for question 3',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 20,
          created_by: lecturerId
        }
      ])
      .execute();

    const category: QuestionCategory = 'Pertemuan 1-Pemikiran Sistem';
    const result = await getQuestionsByCategory(category);

    expect(result).toHaveLength(2);
    expect(result[0].category).toEqual('Pertemuan 1-Pemikiran Sistem');
    expect(result[1].category).toEqual('Pertemuan 1-Pemikiran Sistem');
    expect(result[0].title).toEqual('Question 1');
    expect(result[1].title).toEqual('Question 3');
  });

  it('should return empty array for category with no questions', async () => {
    const category: QuestionCategory = 'Game Theory 2xN';
    const result = await getQuestionsByCategory(category);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return questions with all required fields', async () => {
    // Create lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const lecturerId = lecturerResult[0].id;

    // Create question with keywords and answer pattern
    await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        content: 'Test content',
        category: 'Game Theory MxN',
        max_score: 25,
        keywords: ['keyword1', 'keyword2'],
        answer_pattern: 'expected answer pattern',
        created_by: lecturerId
      })
      .execute();

    const category: QuestionCategory = 'Game Theory MxN';
    const result = await getQuestionsByCategory(category);

    expect(result).toHaveLength(1);
    const question = result[0];
    
    expect(question.id).toBeDefined();
    expect(question.title).toEqual('Test Question');
    expect(question.content).toEqual('Test content');
    expect(question.category).toEqual('Game Theory MxN');
    expect(question.max_score).toEqual(25);
    expect(question.keywords).toEqual(['keyword1', 'keyword2']);
    expect(question.answer_pattern).toEqual('expected answer pattern');
    expect(question.created_by).toEqual(lecturerId);
    expect(question.created_at).toBeInstanceOf(Date);
    expect(question.updated_at).toBeInstanceOf(Date);
  });

  it('should handle questions with null keywords and answer_pattern', async () => {
    // Create lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const lecturerId = lecturerResult[0].id;

    // Create question without keywords and answer pattern
    await db.insert(questionsTable)
      .values({
        title: 'Simple Question',
        content: 'Simple content',
        category: 'Pertemuan 3-Parameter Analisis Jaringan',
        max_score: 30,
        created_by: lecturerId
      })
      .execute();

    const category: QuestionCategory = 'Pertemuan 3-Parameter Analisis Jaringan';
    const result = await getQuestionsByCategory(category);

    expect(result).toHaveLength(1);
    const question = result[0];
    
    expect(question.keywords).toBeNull();
    expect(question.answer_pattern).toBeNull();
    expect(question.title).toEqual('Simple Question');
    expect(question.max_score).toEqual(30);
  });
});
