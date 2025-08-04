
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, questionsTable, answersTable } from '../db/schema';
import { getQuestionAnswers } from '../handlers/get_question_answers';

describe('getQuestionAnswers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all answers for a specific question', async () => {
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

    // Create students
    const student1Result = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Student One',
        nim: '12345',
        attendance_number: 1,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const student2Result = await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Student Two',
        nim: '12346',
        attendance_number: 2,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const student1Id = student1Result[0].id;
    const student2Id = student2Result[0].id;

    // Create question
    const questionResult = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        content: 'What is systems thinking?',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 100,
        created_by: lecturerId
      })
      .returning()
      .execute();

    const questionId = questionResult[0].id;

    // Create another question for testing isolation
    const question2Result = await db.insert(questionsTable)
      .values({
        title: 'Other Question',
        content: 'What is network analysis?',
        category: 'PERTEMUAN 2- ANALISIS JARINGAN',
        max_score: 50,
        created_by: lecturerId
      })
      .returning()
      .execute();

    const question2Id = question2Result[0].id;

    // Create answers for the first question
    await db.insert(answersTable)
      .values([
        {
          question_id: questionId,
          student_id: student1Id,
          content: 'Systems thinking is a holistic approach...',
          status: 'pending'
        },
        {
          question_id: questionId,
          student_id: student2Id,
          content: 'It involves understanding interconnections...',
          auto_score: 75,
          status: 'auto_scored'
        }
      ])
      .execute();

    // Create answer for the second question (should not be returned)
    await db.insert(answersTable)
      .values({
        question_id: question2Id,
        student_id: student1Id,
        content: 'Network analysis is...',
        status: 'pending'
      })
      .execute();

    const answers = await getQuestionAnswers(questionId);

    expect(answers).toHaveLength(2);
    
    // Verify all answers belong to the correct question
    answers.forEach(answer => {
      expect(answer.question_id).toEqual(questionId);
    });

    // Check specific answer details
    const pendingAnswer = answers.find(a => a.status === 'pending');
    const scoredAnswer = answers.find(a => a.status === 'auto_scored');

    expect(pendingAnswer).toBeDefined();
    expect(pendingAnswer!.student_id).toEqual(student1Id);
    expect(pendingAnswer!.content).toEqual('Systems thinking is a holistic approach...');
    expect(pendingAnswer!.auto_score).toBeNull();

    expect(scoredAnswer).toBeDefined();
    expect(scoredAnswer!.student_id).toEqual(student2Id);
    expect(scoredAnswer!.content).toEqual('It involves understanding interconnections...');
    expect(scoredAnswer!.auto_score).toEqual(75);
  });

  it('should return empty array for question with no answers', async () => {
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

    // Create question without answers
    const questionResult = await db.insert(questionsTable)
      .values({
        title: 'Unanswered Question',
        content: 'This question has no answers yet',
        category: 'Pertemuan 1-Pemikiran Sistem',
        max_score: 100,
        created_by: lecturerId
      })
      .returning()
      .execute();

    const questionId = questionResult[0].id;

    const answers = await getQuestionAnswers(questionId);

    expect(answers).toHaveLength(0);
  });

  it('should return answers with all status types', async () => {
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

    // Create students
    const studentsResult = await db.insert(usersTable)
      .values([
        {
          role: 'student',
          name: 'Student A',
          nim: '11111',
          attendance_number: 1,
          password_hash: 'hashed_password'
        },
        {
          role: 'student',
          name: 'Student B',
          nim: '22222',
          attendance_number: 2,
          password_hash: 'hashed_password'
        },
        {
          role: 'student',
          name: 'Student C',
          nim: '33333',
          attendance_number: 3,
          password_hash: 'hashed_password'
        }
      ])
      .returning()
      .execute();

    // Create question
    const questionResult = await db.insert(questionsTable)
      .values({
        title: 'Multi-Status Question',
        content: 'Question with various answer statuses',
        category: 'Game Theory MxN',
        max_score: 100,
        created_by: lecturerId
      })
      .returning()
      .execute();

    const questionId = questionResult[0].id;

    // Create answers with different statuses
    await db.insert(answersTable)
      .values([
        {
          question_id: questionId,
          student_id: studentsResult[0].id,
          content: 'Pending answer',
          status: 'pending'
        },
        {
          question_id: questionId,
          student_id: studentsResult[1].id,
          content: 'Auto-scored answer',
          auto_score: 80,
          final_score: 80,
          status: 'auto_scored'
        },
        {
          question_id: questionId,
          student_id: studentsResult[2].id,
          content: 'Manually scored answer',
          manual_score: 95,
          final_score: 95,
          status: 'manually_scored',
          feedback: 'Excellent work!',
          scored_by: lecturerId
        }
      ])
      .execute();

    const answers = await getQuestionAnswers(questionId);

    expect(answers).toHaveLength(3);

    const statusCounts = answers.reduce((acc, answer) => {
      acc[answer.status] = (acc[answer.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(statusCounts['pending']).toEqual(1);
    expect(statusCounts['auto_scored']).toEqual(1);
    expect(statusCounts['manually_scored']).toEqual(1);

    // Verify manually scored answer has feedback and scorer
    const manuallyScored = answers.find(a => a.status === 'manually_scored');
    expect(manuallyScored!.feedback).toEqual('Excellent work!');
    expect(manuallyScored!.scored_by).toEqual(lecturerId);
    expect(manuallyScored!.final_score).toEqual(95);
  });
});
