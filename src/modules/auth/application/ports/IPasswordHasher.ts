// Defines the contract for password hashing operations.
//
// The application layer depends on this contract instead of
// depending directly on Argon2 or any other hashing library.
export interface IPasswordHasher {
    // Converts a plain-text password into a secure hash.
    hash(password: string): Promise<string>;

    // Checks whether a plain-text password matches a stored hash.
    compare(password: string, hashedPassword: string): Promise<boolean>;
}
