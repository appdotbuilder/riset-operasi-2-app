
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, questionsTable, answersTable } from '../db/schema';
import { getStudentAnswers } from '../handlers/get_student_answers';

describe('getStudentAnswers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when student has no answers', async () => {
    // Create a student
    const [student] = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '12345',
        attendance_number: 1,
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    const result = await getStudentAnswers(student.id);

    expect(result).toEqual([]);
  });

  it('should return student answers ordered by submission date (newest first)', async () => {
    // Create lecturer
    const [lecturer] = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '12345',
        attendance_number: 1,
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create questions
    const [question1] = await db.insert(questionsTable)
      .values({
        title: 'Question 1',
        content: 'First question content',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 10,
        created_by: lecturer.id
      })
      .returning()
      .execute();

    const [question2] = await db.insert(questionsTable)
      .values({
        title: 'Question 2',
        content: 'Second question content',
        category: 'Game Theory 2xN',
        max_score: 15,
        created_by: lecturer.id
      })
      .returning()
      .execute();

    // Create answers with different submission times
    const firstDate = new Date('2024-01-01T10:00:00Z');
    const secondDate = new Date('2024-01-01T11:00:00Z');

    await db.insert(answersTable)
      .values({
        question_id: question1.id,
        student_id: student.id,
        content: 'First answer',
        status: 'pending',
        submitted_at: firstDate
      })
      .execute();

    await db.insert(answersTable)
      .values({
        question_id: question2.id,
        student_id: student.id,
        content: 'Second answer',
        auto_score: 12,
        final_score: 12,
        status: 'auto_scored',
        submitted_at: secondDate
      })
      .execute();

    const result = await getStudentAnswers(student.id);

    expect(result).toHaveLength(2);
    
    // Should be ordered by submission date (newest first)
    expect(result[0].content).toBe('Second answer');
    expect(result[0].question_id).toBe(question2.id);
    expect(result[0].auto_score).toBe(12);
    expect(result[0].final_score).toBe(12);
    expect(result[0].status).toBe('auto_scored');
    expect(result[0].submitted_at).toEqual(secondDate);

    expect(result[1].content).toBe('First answer');
    expect(result[1].question_id).toBe(question1.id);
    expect(result[1].auto_score).toBeNull();
    expect(result[1].final_score).toBeNull();
    expect(result[1].status).toBe('pending');
    expect(result[1].submitted_at).toEqual(firstDate);

    // Verify all required fields are present
    result.forEach(answer => {
      expect(answer.id).toBeDefined();
      expect(answer.question_id).toBeDefined();
      expect(answer.student_id).toBe(student.id);
      expect(answer.content).toBeDefined();
      expect(answer.status).toBeDefined();
      expect(answer.submitted_at).toBeInstanceOf(Date);
    });
  });

  it('should return only answers for the specified student', async () => {
    // Create lecturer
    const [lecturer] = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create two students
    const [student1] = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Student 1',
        nim: '11111',
        attendance_number: 1,
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    const [student2] = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Student 2',
        nim: '22222',
        attendance_number: 2,
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create question
    const [question] = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        content: 'Test content',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 10,
        created_by: lecturer.id
      })
      .returning()
      .execute();

    // Create answers for both students
    await db.insert(answersTable)
      .values({
        question_id: question.id,
        student_id: student1.id,
        content: 'Answer by student 1',
        status: 'pending'
      })
      .execute();

    await db.insert(answersTable)
      .values({
        question_id: question.id,
        student_id: student2.id,
        content: 'Answer by student 2',
        status: 'pending'
      })
      .execute();

    // Get answers for student 1 only
    const result = await getStudentAnswers(student1.id);

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toBe(student1.id);
    expect(result[0].content).toBe('Answer by student 1');
  });

  it('should include all scoring and feedback information', async () => {
    // Create lecturer
    const [lecturer] = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Test Lecturer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Test Student',
        nim: '12345',
        attendance_number: 1,
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create question
    const [question] = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        content: 'Test content',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 20,
        created_by: lecturer.id
      })
      .returning()
      .execute();

    // Create answer with full scoring information
    const scoredDate = new Date('2024-01-01T12:00:00Z');
    await db.insert(answersTable)
      .values({
        question_id: question.id,
        student_id: student.id,
        content: 'Comprehensive answer',
        auto_score: 15,
        manual_score: 18,
        final_score: 18,
        status: 'manually_scored',
        feedback: 'Good answer with minor improvements needed',
        scored_at: scoredDate,
        scored_by: lecturer.id
      })
      .execute();

    const result = await getStudentAnswers(student.id);

    expect(result).toHaveLength(1);
    expect(result[0].auto_score).toBe(15);
    expect(result[0].manual_score).toBe(18);
    expect(result[0].final_score).toBe(18);
    expect(result[0].status).toBe('manually_scored');
    expect(result[0].feedback).toBe('Good answer with minor improvements needed');
    expect(result[0].scored_at).toEqual(scoredDate);
    expect(result[0].scored_by).toBe(lecturer.id);
  });
});
