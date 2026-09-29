import { CreateUserData, UpdateUserData } from "../../application/dto/User";
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserModel } from "../database/mongoose/models/UserModel";

// Implements the User repository using MongoDB and Mongoose.
export class UserRepository implements IUserRepository {
    // Creates a new User in the database.
    async createUser(data: CreateUserData): Promise<User> {
        const userDocument = await UserModel.create(data);

        // Convert the MongoDB document into a domain User entity.
        return User.reconstitute({
            id: userDocument._id.toString(),
            name: userDocument.name,
            email: userDocument.email,
            password: userDocument.password,
            createdAt: userDocument.createdAt,
            updatedAt: userDocument.updatedAt,
        });
    }

    // Finds a User by their unique ID.
    async findById(id: string): Promise<User | null> {
        const userDocument = await UserModel.findById(id);

        if (!userDocument) {
            return null;
        }

        // Convert the MongoDB document into a domain User entity.
        return User.reconstitute({
            id: userDocument._id.toString(),
            name: userDocument.name,
            email: userDocument.email,
            password: userDocument.password,
            createdAt: userDocument.createdAt,
            updatedAt: userDocument.updatedAt,
        });
    }

    // Finds a User by their email address.
    async findByEmail(email: string): Promise<User | null> {
        const userDocument = await UserModel.findOne({ email });

        if (!userDocument) {
            return null;
        }

        // Convert the MongoDB document into a domain User entity.
        return User.reconstitute({
            id: userDocument._id.toString(),
            name: userDocument.name,
            email: userDocument.email,
            password: userDocument.password,
            createdAt: userDocument.createdAt,
            updatedAt: userDocument.updatedAt,
        });
    }

    // Updates an existing User and returns the updated entity.
    async updateUser(
        id: string,
        data: UpdateUserData
    ): Promise<User | null> {
        const userDocument = await UserModel.findByIdAndUpdate(
            id,
            { $set: data },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!userDocument) {
            return null;
        }

        // Convert the MongoDB document into a domain User entity.
        return User.reconstitute({
            id: userDocument._id.toString(),
            name: userDocument.name,
            email: userDocument.email,
            password: userDocument.password,
            createdAt: userDocument.createdAt,
            updatedAt: userDocument.updatedAt,
        });
    }
}
