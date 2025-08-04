
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, questionsTable, answersTable } from '../db/schema';
import { getProgressReport } from '../handlers/get_progress_report';

describe('getProgressReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return progress report for student with answers', async () => {
    // Create lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hashed_password_123'
      })
      .returning()
      .execute();
    const lecturerId = lecturerResult[0].id;

    // Create student
    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '12345',
        attendance_number: 1,
        password_hash: 'hashed_password_123'
      })
      .returning()
      .execute();
    const studentId = studentResult[0].id;

    // Create questions
    const question1Result = await db.insert(questionsTable)
      .values({
        title: 'Question 1',
        content: 'What is systems thinking?',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 10,
        created_by: lecturerId
      })
      .returning()
      .execute();

    const question2Result = await db.insert(questionsTable)
      .values({
        title: 'Question 2',
        content: 'Explain network analysis',
        category: 'PERTEMUAN 2- ANALISIS JARINGAN',
        max_score: 15,
        created_by: lecturerId
      })
      .returning()
      .execute();

    // Create answers
    await db.insert(answersTable)
      .values([
        {
          question_id: question1Result[0].id,
          student_id: studentId,
          content: 'Systems thinking is...',
          final_score: 8,
          status: 'manually_scored'
        },
        {
          question_id: question2Result[0].id,
          student_id: studentId,
          content: 'Network analysis involves...',
          final_score: null,
          status: 'pending'
        }
      ])
      .execute();

    const result = await getProgressReport(studentId);

    expect(result.student_id).toEqual(studentId);
    expect(result.answers).toHaveLength(2);

    // Check first answer
    const answer1 = result.answers.find(a => a.question_id === question1Result[0].id);
    expect(answer1).toBeDefined();
    expect(answer1!.question_title).toEqual('Question 1');
    expect(answer1!.category).toEqual('Pertemuan 1-Pemikiran Sistem');
    expect(answer1!.final_score).toEqual(8);
    expect(answer1!.max_score).toEqual(10);
    expect(answer1!.status).toEqual('manually_scored');
    expect(answer1!.submitted_at).toBeInstanceOf(Date);

    // Check second answer
    const answer2 = result.answers.find(a => a.question_id === question2Result[0].id);
    expect(answer2).toBeDefined();
    expect(answer2!.question_title).toEqual('Question 2');
    expect(answer2!.category).toEqual('PERTEMUAN 2- ANALISIS JARINGAN');
    expect(answer2!.final_score).toBeNull();
    expect(answer2!.max_score).toEqual(15);
    expect(answer2!.status).toEqual('pending');
    expect(answer2!.submitted_at).toBeInstanceOf(Date);
  });

  it('should return empty progress report for student with no answers', async () => {
    // Create student
    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Student No Answers',
        nim: '99999',
        attendance_number: 2,
        password_hash: 'hashed_password_123'
      })
      .returning()
      .execute();

    const result = await getProgressReport(studentResult[0].id);

    expect(result.student_id).toEqual(studentResult[0].id);
    expect(result.answers).toHaveLength(0);
  });

  it('should include all answer fields correctly', async () => {
    // Create prerequisite data
    const lecturerResult = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hashed_password_123'
      })
      .returning()
      .execute();

    const studentResult = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '11111',
        attendance_number: 3,
        password_hash: 'hashed_password_123'
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        title: 'Monte Carlo Question',
        content: 'Explain Monte Carlo simulation',
        category: 'Pertemuan 5- Simulasi Monte Carlo',
        max_score: 20,
        created_by: lecturerResult[0].id
      })
      .returning()
      .execute();

    // Create answer with auto scoring
    await db.insert(answersTable)
      .values({
        question_id: questionResult[0].id,
        student_id: studentResult[0].id,
        content: 'Monte Carlo simulation uses random sampling...',
        final_score: 12,
        status: 'auto_scored'
      })
      .execute();

    const result = await getProgressReport(studentResult[0].id);

    expect(result.answers).toHaveLength(1);
    const answer = result.answers[0];
    
    expect(answer.question_id).toEqual(questionResult[0].id);
    expect(answer.question_title).toEqual('Monte Carlo Question');
    expect(answer.category).toEqual('Pertemuan 5- Simulasi Monte Carlo');
    expect(answer.final_score).toEqual(12);
    expect(answer.max_score).toEqual(20);
    expect(answer.status).toEqual('auto_scored');
    expect(answer.submitted_at).toBeInstanceOf(Date);
  });
});
