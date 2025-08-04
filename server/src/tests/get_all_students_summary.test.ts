
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, questionsTable, answersTable } from '../db/schema';
import { getAllStudentsSummary } from '../handlers/get_all_students_summary';

describe('getAllStudentsSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no students exist', async () => {
    const result = await getAllStudentsSummary();
    expect(result).toEqual([]);
  });

  it('should return summary for students with no answers', async () => {
    // Create a student
    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'John Doe',
        nim: '12345',
        attendance_number: 1,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create a lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Dr. Smith',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create a question
    await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        content: 'What is systems thinking?',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 10,
        created_by: lecturerResult[0].id
      })
      .execute();

    const result = await getAllStudentsSummary();

    expect(result).toHaveLength(1);
    expect(result[0].student_name).toEqual('John Doe');
    expect(result[0].nim).toEqual('12345');
    expect(result[0].total_questions).toEqual(1);
    expect(result[0].answered_questions).toEqual(0);
    expect(result[0].total_score).toEqual(0);
    expect(result[0].max_possible_score).toEqual(10);
    expect(result[0].percentage).toEqual(0);
    expect(result[0].category_scores).toHaveLength(1);
    expect(result[0].category_scores[0].category).toEqual('Pertemuan 1-Pemikiran Sistem');
    expect(result[0].category_scores[0].score).toEqual(0);
    expect(result[0].category_scores[0].max_score).toEqual(10);
    expect(result[0].category_scores[0].percentage).toEqual(0);
  });

  it('should calculate scores correctly for students with answers', async () => {
    // Create students
    const student1Result = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Alice',
        nim: '11111',
        attendance_number: 1,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const student2Result = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Bob',
        nim: '22222',
        attendance_number: 2,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create a lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Dr. Smith',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create questions in different categories
    const question1Result = await db.insert(questionsTable)
      .values({
        title: 'Systems Question',
        content: 'What is systems thinking?',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 10,
        created_by: lecturerResult[0].id
      })
      .returning()
      .execute();

    const question2Result = await db.insert(questionsTable)
      .values({
        title: 'Network Question',
        content: 'Explain network analysis',
        category: 'PERTEMUAN 2- ANALISIS JARINGAN',
        max_score: 15,
        created_by: lecturerResult[0].id
      })
      .returning()
      .execute();

    // Create answers
    await db.insert(answersTable)
      .values({
        question_id: question1Result[0].id,
        student_id: student1Result[0].id,
        content: 'Systems thinking is...',
        final_score: 8,
        status: 'manually_scored'
      })
      .execute();

    await db.insert(answersTable)
      .values({
        question_id: question2Result[0].id,
        student_id: student1Result[0].id,
        content: 'Network analysis is...',
        final_score: 12,
        status: 'manually_scored'
      })
      .execute();

    await db.insert(answersTable)
      .values({
        question_id: question1Result[0].id,
        student_id: student2Result[0].id,
        content: 'Systems thinking involves...',
        final_score: 6,
        status: 'manually_scored'
      })
      .execute();

    const result = await getAllStudentsSummary();

    expect(result).toHaveLength(2);

    // Check Alice's summary
    const aliceSummary = result.find(s => s.student_name === 'Alice');
    expect(aliceSummary).toBeDefined();
    expect(aliceSummary!.nim).toEqual('11111');
    expect(aliceSummary!.total_questions).toEqual(2);
    expect(aliceSummary!.answered_questions).toEqual(2);
    expect(aliceSummary!.total_score).toEqual(20); // 8 + 12
    expect(aliceSummary!.max_possible_score).toEqual(25); // 10 + 15
    expect(aliceSummary!.percentage).toEqual(80); // (20/25) * 100
    expect(aliceSummary!.category_scores).toHaveLength(2);

    // Check Bob's summary
    const bobSummary = result.find(s => s.student_name === 'Bob');
    expect(bobSummary).toBeDefined();
    expect(bobSummary!.nim).toEqual('22222');
    expect(bobSummary!.total_questions).toEqual(2);
    expect(bobSummary!.answered_questions).toEqual(1);
    expect(bobSummary!.total_score).toEqual(6);
    expect(bobSummary!.max_possible_score).toEqual(25);
    expect(bobSummary!.percentage).toEqual(24); // (6/25) * 100
  });

  it('should handle category scores correctly', async () => {
    // Create a student
    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Charlie',
        nim: '33333',
        attendance_number: 3,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create a lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Dr. Smith',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create multiple questions in the same category
    const question1Result = await db.insert(questionsTable)
      .values({
        title: 'Systems Question 1',
        content: 'What is systems thinking?',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 10,
        created_by: lecturerResult[0].id
      })
      .returning()
      .execute();

    const question2Result = await db.insert(questionsTable)
      .values({
        title: 'Systems Question 2',
        content: 'Explain systems approach',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 15,
        created_by: lecturerResult[0].id
      })
      .returning()
      .execute();

    // Create answers
    await db.insert(answersTable)
      .values({
        question_id: question1Result[0].id,
        student_id: studentResult[0].id,
        content: 'Systems thinking is...',
        final_score: 7,
        status: 'manually_scored'
      })
      .execute();

    await db.insert(answersTable)
      .values({
        question_id: question2Result[0].id,
        student_id: studentResult[0].id,
        content: 'Systems approach involves...',
        final_score: 10,
        status: 'manually_scored'
      })
      .execute();

    const result = await getAllStudentsSummary();

    expect(result).toHaveLength(1);
    expect(result[0].category_scores).toHaveLength(1);
    
    const categoryScore = result[0].category_scores[0];
    expect(categoryScore.category).toEqual('Pertemuan 1-Pemikiran Sistem');
    expect(categoryScore.score).toEqual(17); // 7 + 10
    expect(categoryScore.max_score).toEqual(25); // 10 + 15
    expect(categoryScore.percentage).toEqual(68); // (17/25) * 100
  });

  it('should exclude lecturers from student summaries', async () => {
    // Create a lecturer
    await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Dr. Smith',
        password_hash: 'hashed_password'
      })
      .execute();

    // Create a student
    await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Student',
        nim: '44444',
        attendance_number: 4,
        password_hash: 'hashed_password'
      })
      .execute();

    const result = await getAllStudentsSummary();

    expect(result).toHaveLength(1);
    expect(result[0].student_name).toEqual('Student');
  });

  it('should handle answers without final scores', async () => {
    // Create a student
    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'David',
        nim: '55555',
        attendance_number: 5,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create a lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Dr. Smith',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create a question
    const questionResult = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        content: 'What is systems thinking?',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 10,
        created_by: lecturerResult[0].id
      })
      .returning()
      .execute();

    // Create answer without final score (pending)
    await db.insert(answersTable)
      .values({
        question_id: questionResult[0].id,
        student_id: studentResult[0].id,
        content: 'Systems thinking is...',
        final_score: null,
        status: 'pending'
      })
      .execute();

    const result = await getAllStudentsSummary();

    expect(result).toHaveLength(1);
    expect(result[0].answered_questions).toEqual(1);
    expect(result[0].total_score).toEqual(0); // No final score yet
    expect(result[0].percentage).toEqual(0);
    expect(result[0].category_scores[0].score).toEqual(0);
    expect(result[0].category_scores[0].percentage).toEqual(0);
  });
});
