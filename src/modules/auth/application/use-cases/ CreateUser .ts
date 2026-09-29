import { IUserRepository } from "../../domain/repositories/IUserRepository";

import { CreateUserData } from "../dto/User";

// Handles the application workflow for creating a new User.
export class CreateUserUseCase {
    // Inject the User repository through its interface.
    //
    // The use case depends on the repository contract,
    // not on a specific database or persistence implementation.
    constructor(
        private readonly userRepo: IUserRepository
    ) { }

    // Executes the user creation workflow.
    //
    // Receives the data required to create a new User
    // and delegates persistence to the User repository.
    async execute(data: CreateUserData) {
        return this.userRepo.createUser(data);
    }
}