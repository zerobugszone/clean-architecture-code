import { Request, Response } from 'express';
import { userFactory } from "../factories/UserFactory";

export class UserController {
    async create(req: Request, res: Response): Promise<Response> {
        const user = await userFactory.createUserUseCase.execute(req.body)

        return res.status(201).json(user);
    }
}