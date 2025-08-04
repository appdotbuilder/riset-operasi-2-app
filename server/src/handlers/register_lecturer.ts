
import { type LecturerRegisterInput, type User } from '../schema';

export async function registerLecturer(input: LecturerRegisterInput): Promise<User> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is registering a new lecturer with name and password.
    // Should hash the password before storing and check for duplicate names.
    return Promise.resolve({
        id: 0, // Placeholder ID
        role: 'lecturer' as const,
        name: input.name,
        nim: null,
        attendance_number: null,
        password_hash: 'hashed_password_placeholder',
        created_at: new Date()
    } as User);
}
