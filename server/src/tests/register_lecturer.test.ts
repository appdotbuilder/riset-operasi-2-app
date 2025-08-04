
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LecturerRegisterInput } from '../schema';
import { registerLecturer } from '../handlers/register_lecturer';
import { eq } from 'drizzle-orm';

const testInput: LecturerRegisterInput = {
  name: 'Dr. John Smith',
  password: 'securepassword123'
};

describe('registerLecturer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a lecturer', async () => {
    const result = await registerLecturer(testInput);

    // Basic field validation
    expect(result.name).toEqual('Dr. John Smith');
    expect(result.role).toEqual('lecturer');
    expect(result.nim).toBeNull();
    expect(result.attendance_number).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('securepassword123'); // Should be hashed
  });

  it('should save lecturer to database', async () => {
    const result = await registerLecturer(testInput);

    // Query database to verify lecturer was saved
    const lecturers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(lecturers).toHaveLength(1);
    expect(lecturers[0].name).toEqual('Dr. John Smith');
    expect(lecturers[0].role).toEqual('lecturer');
    expect(lecturers[0].nim).toBeNull();
    expect(lecturers[0].attendance_number).toBeNull();
    expect(lecturers[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await registerLecturer(testInput);

    // Verify password is hashed and can be verified
    const isValid = await Bun.password.verify('securepassword123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should throw error for duplicate lecturer name', async () => {
    // Register first lecturer
    await registerLecturer(testInput);

    // Try to register another lecturer with same name
    await expect(registerLecturer(testInput))
      .rejects.toThrow(/already exists/i);
  });

  it('should allow different lecturers with different names', async () => {
    // Register first lecturer
    const firstLecturer = await registerLecturer(testInput);

    // Register second lecturer with different name
    const secondInput: LecturerRegisterInput = {
      name: 'Prof. Jane Doe',
      password: 'anotherpassword456'
    };
    const secondLecturer = await registerLecturer(secondInput);

    // Verify both lecturers exist
    expect(firstLecturer.id).not.toEqual(secondLecturer.id);
    expect(firstLecturer.name).toEqual('Dr. John Smith');
    expect(secondLecturer.name).toEqual('Prof. Jane Doe');

    // Verify both are in database
    const allLecturers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.role, 'lecturer'))
      .execute();

    expect(allLecturers).toHaveLength(2);
  });
});
