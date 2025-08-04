
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq, or } from 'drizzle-orm';

export const login = async (input: LoginInput): Promise<User> => {
  try {
    // Find user by NIM (for students) or name (for lecturers)
    const users = await db.select()
      .from(usersTable)
      .where(
        or(
          eq(usersTable.nim, input.identifier),
          eq(usersTable.name, input.identifier)
        )
      )
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // Verify password using Bun's built-in password verification
    const isPasswordValid = await Bun.password.verify(input.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
