import argon2 from 'argon2';

import { IPasswordHasher } from '../../application/ports/IPasswordHasher';

// Implements password hashing using Argon2.
export class Argon2PasswordHasher implements IPasswordHasher {
    // Hashes a plain-text password using Argon2.
    async hash(password: string): Promise<string> {
        return argon2.hash(password);
    }

    // Compares a plain-text password against an Argon2 hash.
    async compare(
        password: string,
        hashedPassword: string
    ): Promise<boolean> {
        return argon2.verify(hashedPassword, password);
    }
}
