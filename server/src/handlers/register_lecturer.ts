
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LecturerRegisterInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const registerLecturer = async (input: LecturerRegisterInput): Promise<User> => {
  try {
    // Check if lecturer with same name already exists
    const existingLecturer = await db.select()
      .from(usersTable)
      .where(eq(usersTable.name, input.name))
      .execute();

    if (existingLecturer.length > 0) {
      throw new Error('Lecturer with this name already exists');
    }

    // Hash the password (simple implementation - in production use bcrypt)
    const passwordHash = await Bun.password.hash(input.password);

    // Insert lecturer record
    const result = await db.insert(usersTable)
      .values({
        role: 'lecturer',
        name: input.name,
        nim: null,
        attendance_number: null,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Lecturer registration failed:', error);
    throw error;
  }
};
