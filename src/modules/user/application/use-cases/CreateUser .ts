import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../ports/IPasswordHasher';
import { CreateUserData } from '../dto/User';

// Handles the application workflow for creating a new User.
export class CreateUserUseCase {
    // Inject the User repository and password hasher through their interfaces.
    //
    // The use case depends on contracts rather than concrete
    // database or password hashing implementations.
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly passwordHasher: IPasswordHasher
    ) { }

    // Executes the user creation workflow.
    //
    // 1. Hash the plain-text password.
    // 2. Replace the plain-text password with the generated hash.
    // 3. Persist the user through the repository.
    async execute(data: CreateUserData) {
        const hashedPassword = await this.passwordHasher.hash(data.password);

        const user = await this.userRepo.createUser({
            ...data,
            password: hashedPassword,
        });

        return user;
    }
}
