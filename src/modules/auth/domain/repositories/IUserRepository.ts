// Imports the DTOs used for User creation and update operations.
import {
    CreateUserData,
    UpdateUserData
} from "../../application/dto/User";

// Imports the User Domain Entity.
//
// The repository returns a User entity instead of exposing
// database-specific objects such as Mongoose Documents.
import { User } from "../entities/User";


// Defines the contract for User persistence operations.
//
// This interface does not contain any database implementation.
// Infrastructure will implement this interface using MongoDB,
// PostgreSQL, or another persistence technology.
export interface IUserRepository {

    // Creates a new User and returns the created User entity.
    createUser(data: CreateUserData): Promise<User>;


    // Updates an existing User using its ID.
    //
    // Returns the updated User if found.
    // Returns null if the User does not exist.
    updateUser(
        id: string,
        data: UpdateUserData
    ): Promise<User | null>;


    // Finds a User by their unique ID.
    //
    // Returns the User if found, otherwise null.
    findById(id: string): Promise<User | null>;


    // Finds a User by their email address.
    //
    // Returns the User if found, otherwise null.
    findByEmail(email: string): Promise<User | null>;
}
