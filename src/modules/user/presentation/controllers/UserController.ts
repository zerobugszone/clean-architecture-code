import { Request, Response } from 'express';
import { userFactory } from '../factories/UserFactory';

// Handles HTTP requests related to Users.
export class UserController {
    // Creates a new User through the CreateUser use case.
    async create(req: Request, res: Response): Promise<Response> {
        const user = await userFactory.createUserUseCase.execute(req.body);

        return res.status(201).json(user);
    }
}