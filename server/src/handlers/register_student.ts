
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type StudentRegisterInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const registerStudent = async (input: StudentRegisterInput): Promise<User> => {
  try {
    // Check for duplicate NIM
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.nim, input.nim))
      .execute();

    if (existingUser.length > 0) {
      throw new Error('NIM already exists');
    }

    // Hash the password using Bun's built-in password hashing
    const passwordHash = await Bun.password.hash(input.password);

    // Insert student record
    const result = await db.insert(usersTable)
      .values({
        role: 'student',
        name: input.name,
        nim: input.nim,
        attendance_number: input.attendance_number,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Student registration failed:', error);
    throw error;
  }
};
