
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate student with NIM', async () => {
    // Create test student
    const passwordHash = await Bun.password.hash('password123');
    await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'John Doe',
        nim: '12345',
        attendance_number: 1,
        password_hash: passwordHash
      })
      .execute();

    const input: LoginInput = {
      identifier: '12345',
      password: 'password123'
    };

    const result = await login(input);

    expect(result.role).toEqual('student');
    expect(result.name).toEqual('John Doe');
    expect(result.nim).toEqual('12345');
    expect(result.attendance_number).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should authenticate lecturer with name', async () => {
    // Create test lecturer
    const passwordHash = await Bun.password.hash('password456');
    await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: 'Dr. Smith',
        nim: null,
        attendance_number: null,
        password_hash: passwordHash
      })
      .execute();

    const input: LoginInput = {
      identifier: 'Dr. Smith',
      password: 'password456'
    };

    const result = await login(input);

    expect(result.role).toEqual('lecturer');
    expect(result.name).toEqual('Dr. Smith');
    expect(result.nim).toBeNull();
    expect(result.attendance_number).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should reject invalid identifier', async () => {
    const input: LoginInput = {
      identifier: 'nonexistent',
      password: 'password123'
    };

    await expect(login(input)).rejects.toThrow(/invalid credentials/i);
  });

  it('should reject invalid password', async () => {
    // Create test user
    const passwordHash = await Bun.password.hash('correct_password');
    await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Jane Doe',
        nim: '54321',
        attendance_number: 2,
        password_hash: passwordHash
      })
      .execute();

    const input: LoginInput = {
      identifier: '54321',
      password: 'wrong_password'
    };

    await expect(login(input)).rejects.toThrow(/invalid credentials/i);
  });

  it('should handle student login with name identifier', async () => {
    // Create test student
    const passwordHash = await Bun.password.hash('password789');
    await db.insert(usersTable)
      .values({
        role: 'student',
        name: 'Alice Johnson',
        nim: '67890',
        attendance_number: 3,
        password_hash: passwordHash
      })
      .execute();

    const input: LoginInput = {
      identifier: 'Alice Johnson',
      password: 'password789'
    };

    const result = await login(input);

    expect(result.role).toEqual('student');
    expect(result.name).toEqual('Alice Johnson');
    expect(result.nim).toEqual('67890');
    expect(result.attendance_number).toEqual(3);
  });
});
