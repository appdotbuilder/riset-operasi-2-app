
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, questionsTable, answersTable } from '../db/schema';
import { getScoreSummary } from '../handlers/get_score_summary';
import { eq } from 'drizzle-orm';

describe('getScoreSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate score summary for student with no answers', async () => {
    // Create student
    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '12345678',
        attendance_number: 1,
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const studentId = studentResult[0].id;

    // Create lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const lecturerId = lecturerResult[0].id;

    // Create questions
    await db.insert(questionsTable)
      .values([
        {
          title: 'Question 1',
          content: 'Content 1',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 100,
          created_by: lecturerId
        },
        {
          title: 'Question 2',
          content: 'Content 2',
          category: 'PERTEMUAN 2- ANALISIS JARINGAN',
          max_score: 50,
          created_by: lecturerId
        }
      ])
      .execute();

    const result = await getScoreSummary(studentId);

    expect(result.student_id).toEqual(studentId);
    expect(result.student_name).toEqual('Test Student');
    expect(result.nim).toEqual('12345678');
    expect(result.total_questions).toEqual(2);
    expect(result.answered_questions).toEqual(0);
    expect(result.total_score).toEqual(0);
    expect(result.max_possible_score).toEqual(150);
    expect(result.percentage).toEqual(0);
    expect(result.category_scores).toHaveLength(7); // All categories
    
    // Check specific categories
    const systemThinkingCategory = result.category_scores.find(
      c => c.category === 'Pertemuan 1-Pemikiran Sistem'
    );
    expect(systemThinkingCategory?.score).toEqual(0);
    expect(systemThinkingCategory?.max_score).toEqual(100);
    expect(systemThinkingCategory?.percentage).toEqual(0);
  });

  it('should calculate score summary for student with some answers', async () => {
    // Create student
    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '12345678',
        attendance_number: 1,
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const studentId = studentResult[0].id;

    // Create lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const lecturerId = lecturerResult[0].id;

    // Create questions
    const questionsResult = await db.insert(questionsTable)
      .values([
        {
          title: 'Question 1',
          content: 'Content 1',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 100,
          created_by: lecturerId
        },
        {
          title: 'Question 2',
          content: 'Content 2',
          category: 'PERTEMUAN 2- ANALISIS JARINGAN',
          max_score: 50,
          created_by: lecturerId
        },
        {
          title: 'Question 3',
          content: 'Content 3',
          category: 'Pertemuan 1-Pemikiran Sistem',
          max_score: 75,
          created_by: lecturerId
        }
      ])
      .returning()
      .execute();

    const [question1, question2] = questionsResult;

    // Create answers
    await db.insert(answersTable)
      .values([
        {
          question_id: question1.id,
          student_id: studentId,
          content: 'Answer 1',
          final_score: 80,
          status: 'manually_scored'
        },
        {
          question_id: question2.id,
          student_id: studentId,
          content: 'Answer 2',
          final_score: 45,
          status: 'auto_scored'
        }
      ])
      .execute();

    const result = await getScoreSummary(studentId);

    expect(result.student_id).toEqual(studentId);
    expect(result.student_name).toEqual('Test Student');
    expect(result.nim).toEqual('12345678');
    expect(result.total_questions).toEqual(3);
    expect(result.answered_questions).toEqual(2);
    expect(result.total_score).toEqual(125); // 80 + 45
    expect(result.max_possible_score).toEqual(225); // 100 + 50 + 75
    expect(result.percentage).toEqual(55.56); // (125/225)*100 rounded to 2 decimal places
    
    // Check category scores
    const systemThinkingCategory = result.category_scores.find(
      c => c.category === 'Pertemuan 1-Pemikiran Sistem'
    );
    expect(systemThinkingCategory?.score).toEqual(80);
    expect(systemThinkingCategory?.max_score).toEqual(175); // 100 + 75
    expect(systemThinkingCategory?.percentage).toEqual(45.71);

    const networkAnalysisCategory = result.category_scores.find(
      c => c.category === 'PERTEMUAN 2- ANALISIS JARINGAN'
    );
    expect(networkAnalysisCategory?.score).toEqual(45);
    expect(networkAnalysisCategory?.max_score).toEqual(50);
    expect(networkAnalysisCategory?.percentage).toEqual(90);
  });

  it('should handle student with null final scores', async () => {
    // Create student
    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '12345678',
        attendance_number: 1,
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const studentId = studentResult[0].id;

    // Create lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const lecturerId = lecturerResult[0].id;

    // Create question
    const questionResult = await db.insert(questionsTable)
      .values({
        title: 'Question 1',
        content: 'Content 1',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 100,
        created_by: lecturerId
      })
      .returning()
      .execute();

    const question = questionResult[0];

    // Create answer with null final_score (pending)
    await db.insert(answersTable)
      .values({
        question_id: question.id,
        student_id: studentId,
        content: 'Answer 1',
        final_score: null,
        status: 'pending'
      })
      .execute();

    const result = await getScoreSummary(studentId);

    expect(result.total_score).toEqual(0); // null scores treated as 0
    expect(result.answered_questions).toEqual(1);
    expect(result.percentage).toEqual(0);
  });

  it('should throw error for non-existent student', async () => {
    expect(getScoreSummary(999)).rejects.toThrow(/Student not found/i);
  });

  it('should verify all question categories are included', async () => {
    // Create student
    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '12345678',
        attendance_number: 1,
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const studentId = studentResult[0].id;

    const result = await getScoreSummary(studentId);

    const expectedCategories = [
      'Pertemuan 1-Pemikiran Sistem',
      'PERTEMUAN 2- ANALISIS JARINGAN',
      'Pertemuan 3-Parameter Analisis Jaringan',
      'Pertemuan 4-Analisis Jaringan Pada Manajemen Proyek',
      'Pertemuan 5- Simulasi Monte Carlo',
      'Game Theory 2xN',
      'Game Theory MxN'
    ];

    expect(result.category_scores).toHaveLength(7);
    
    expectedCategories.forEach(category => {
      const categoryScore = result.category_scores.find(c => c.category === category);
      expect(categoryScore).toBeDefined();
      expect(categoryScore?.score).toEqual(0);
      expect(categoryScore?.max_score).toEqual(0);
      expect(categoryScore?.percentage).toEqual(0);
    });
  });
});
