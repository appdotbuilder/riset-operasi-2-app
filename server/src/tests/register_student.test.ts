
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type StudentRegisterInput } from '../schema';
import { registerStudent } from '../handlers/register_student';
import { eq } from 'drizzle-orm';

const testInput: StudentRegisterInput = {
  name: 'John Doe',
  nim: '12345678',
  attendance_number: 1,
  password: 'password123'
};

describe('registerStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new student', async () => {
    const result = await registerStudent(testInput);

    // Basic field validation
    expect(result.role).toEqual('student');
    expect(result.name).toEqual('John Doe');
    expect(result.nim).toEqual('12345678');
    expect(result.attendance_number).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
  });

  it('should save student to database', async () => {
    const result = await registerStudent(testInput);

    // Query database to verify student was saved
    const students = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].role).toEqual('student');
    expect(students[0].name).toEqual('John Doe');
    expect(students[0].nim).toEqual('12345678');
    expect(students[0].attendance_number).toEqual(1);
    expect(students[0].password_hash).toBeDefined();
    expect(students[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await registerStudent(testInput);

    // Verify password is hashed (not plain text)
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(20); // Hashed passwords are typically longer

    // Verify password can be verified using Bun's password verification
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails verification
    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should throw error for duplicate NIM', async () => {
    // Register first student
    await registerStudent(testInput);

    // Try to register another student with same NIM
    const duplicateInput: StudentRegisterInput = {
      name: 'Jane Doe',
      nim: '12345678', // Same NIM
      attendance_number: 2,
      password: 'differentpassword'
    };

    expect(registerStudent(duplicateInput)).rejects.toThrow(/NIM already exists/i);
  });

  it('should allow different students with different NIMs', async () => {
    // Register first student
    const firstStudent = await registerStudent(testInput);

    // Register second student with different NIM
    const secondInput: StudentRegisterInput = {
      name: 'Jane Doe',
      nim: '87654321', // Different NIM
      attendance_number: 2,
      password: 'password456'
    };

    const secondStudent = await registerStudent(secondInput);

    // Both should be successfully created
    expect(firstStudent.id).not.toEqual(secondStudent.id);
    expect(firstStudent.nim).toEqual('12345678');
    expect(secondStudent.nim).toEqual('87654321');

    // Verify both exist in database
    const allStudents = await db.select()
      .from(usersTable)
      .where(eq(usersTable.role, 'student'))
      .execute();

    expect(allStudents).toHaveLength(2);
  });
});
