import { CreateUserUseCase } from "../../application/use-cases/CreateUser ";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { Argon2PasswordHasher } from "../../infrastructure/security/Argon2PasswordHasher";

// Creates and manages the dependencies required by User use cases.
class UserFactory {
    // Shared User repository implementation.
    private readonly userRepository = new UserRepository()
    private readonly passwordHasher = new Argon2PasswordHasher()

    // Creates the CreateUser use case using the User repository. 
    private readonly createUserUseCaseInstance = new CreateUserUseCase(this.userRepository, this.passwordHasher);


    // Provides the CreateUser use case to the presentation layer.
    get createUserUseCase(): CreateUserUseCase {
        return this.createUserUseCaseInstance;
    }
}

export const userFactory = new UserFactory();