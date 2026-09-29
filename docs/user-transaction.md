# User + UserRole Transaction Architecture

This document explains how to handle a transaction when creating a `User` and its associated `UserRole` using Clean Architecture and the **Unit of Work pattern**.

The important requirement is:

> Creating the User and assigning the UserRole should be treated as one atomic operation.

If either operation fails, both operations should be rolled back.

---

# 1. Use Case

When creating a user:

```text
Create User
    ↓
Create UserRole
```

Both operations should succeed together.

### Successful flow

```text
Create User
    ↓
Create UserRole
    ↓
Commit Transaction
```

### Failed flow

```text
Create User
    ↓
Create UserRole
    ↓
Error
    ↓
Rollback Transaction
```

The use case decides that creating the `User` and `UserRole` belongs to one atomic workflow.

The infrastructure layer decides how that transaction is implemented.

---

# 2. Architecture

The application should not directly depend on Mongoose transactions.

Instead, the application depends on a **Unit of Work abstraction**.

```text
Application
    │
    ▼
IUserUnitOfWork
    │
    ▼
Infrastructure
    │
    ▼
Mongoose Session
```

The complete flow:

```text
CreateUserUseCase
        │
        ▼
IUserUnitOfWork
        │
        ▼
MongooseUserUnitOfWork
        │
        ├── UserRepository
        │
        └── UserRoleRepository
                │
                ▼
          Same MongoDB Session
```

The important point is that both repositories use the **same MongoDB session**.

---

# 3. Unit of Work

The Unit of Work represents a group of database operations that should be executed as one atomic operation.

Create:

```text
src/application/ports/IUserUnitOfWork.ts
```

Example:

```ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';

export interface IUserUnitOfWorkContext {
  userRepository: IUserRepository;
  userRoleRepository: IUserRoleRepository;
}

export interface IUserUnitOfWork {
  execute<T>(
    operation: (context: IUserUnitOfWorkContext) => Promise<T>
  ): Promise<T>;
}
```

The application only knows that the Unit of Work can execute an operation atomically.

It does not know about:

* Mongoose
* MongoDB sessions
* `startTransaction()`
* `commitTransaction()`
* `abortTransaction()`

---

# 4. User Repository

The domain defines the repository contract:

```text
src/domain/repositories/IUserRepository.ts
```

Example:

```ts
export interface IUserRepository {
  createUser(data: CreateUserData): Promise<User>;

  findById(id: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;
}
```

The application depends on this interface.

The infrastructure provides the implementation:

```text
IUserRepository
       ▲
       │
       │ implements
       │
UserRepository
```

---

# 5. UserRole Repository

Create:

```text
src/domain/repositories/IUserRoleRepository.ts
```

Example:

```ts
import { UserRole } from '../entities/UserRole';

export interface IUserRoleRepository {
  createUserRole(data: {
    userId: string;
    roleId: string;
  }): Promise<UserRole>;
}
```

The infrastructure provides the implementation:

```text
IUserRoleRepository
       ▲
       │
       │ implements
       │
UserRoleRepository
```

---

# 6. CreateUserUseCase

The use case coordinates the complete business workflow.

The important difference is that the use case does **not** receive separate repositories or a transaction object.

Instead, it receives the Unit of Work.

```text
src/application/use-cases/user/CreateUserUseCase.ts
```

Example:

```ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';

import { CreateUserData } from '../dto/User';
import { IPasswordHasher } from '../ports/IPasswordHasher';
import { IUserUnitOfWork } from '../ports/IUserUnitOfWork';

export class CreateUserUseCase {
  constructor(
    private readonly unitOfWork: IUserUnitOfWork,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(data: CreateUserData) {
    const hashedPassword = await this.passwordHasher.hash(data.password);

    return this.unitOfWork.execute(async (context) => {
      const user = await context.userRepository.createUser({
        ...data,
        password: hashedPassword,
      });

      await context.userRoleRepository.createUserRole({
        userId: user.id,
        roleId: 'USER_ROLE_ID',
      });

      return user;
    });
  }
}
```

The workflow is:

```text
CreateUserUseCase
       │
       ▼
Hash Password
       │
       ▼
UnitOfWork.execute()
       │
       ├── Create User
       │
       ├── Create UserRole
       │
       └── Commit
```

If `createUserRole()` fails:

```text
Create User       ✅
       ↓
Create UserRole   ❌
       ↓
UnitOfWork catches error
       ↓
Rollback
```

---

# 7. Why Does the Use Case Not Call `startTransaction()`?

Because transaction management is an infrastructure responsibility.

The use case only says:

```ts
await this.unitOfWork.execute(async (context) => {
  // operations that must be atomic
});
```

It does not need to know whether the implementation uses:

* MongoDB
* PostgreSQL
* MySQL
* another database

The use case only knows the Unit of Work contract.

---

# 8. Mongoose Unit of Work Implementation

The infrastructure implements the Unit of Work.

Create:

```text
src/infrastructure/transactions/MongooseUserUnitOfWork.ts
```

Example:

```ts
import mongoose from 'mongoose';

import {
  IUserUnitOfWork,
  IUserUnitOfWorkContext,
} from '../../application/ports/IUserUnitOfWork';

import { UserRepository } from '../repositories/UserRepository';
import { UserRoleRepository } from '../repositories/UserRoleRepository';

export class MongooseUserUnitOfWork implements IUserUnitOfWork {
  async execute<T>(
    operation: (context: IUserUnitOfWorkContext) => Promise<T>
  ): Promise<T> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const context: IUserUnitOfWorkContext = {
        userRepository: new UserRepository(session),
        userRoleRepository: new UserRoleRepository(session),
      };

      const result = await operation(context);

      await session.commitTransaction();

      return result;
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      await session.endSession();
    }
  }
}
```

This is where the actual MongoDB transaction happens.

```text
MongooseUserUnitOfWork
        │
        ├── startSession()
        │
        ├── startTransaction()
        │
        ├── create repositories with session
        │
        ├── execute use case operation
        │
        ├── commitTransaction()
        │
        └── endSession()
```

---

# 9. Same Session Problem

This is the most important reason we use the Unit of Work.

Suppose MongoDB creates:

```ts
const session = await mongoose.startSession();
```

Both repositories must use this same session.

```text
                 MongoDB Session
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       UserRepository    UserRoleRepository
              │                 │
              ▼                 ▼
          Create User      Create UserRole
```

Therefore the Unit of Work creates them like this:

```ts
const context = {
  userRepository: new UserRepository(session),
  userRoleRepository: new UserRoleRepository(session),
};
```

Both repositories receive the same session.

---

# 10. UserRepository With Session

The repository can receive the session through its constructor.

```ts
import { ClientSession } from 'mongoose';

export class UserRepository implements IUserRepository {
  constructor(
    private readonly session: ClientSession
  ) {}

  async createUser(data: CreateUserData): Promise<User> {
    const [userDocument] = await UserModel.create(
      [data],
      {
        session: this.session,
      }
    );

    // Map document to domain entity...
  }
}
```

The important part is:

```ts
session: this.session
```

The database operation is therefore part of the current transaction.

---

# 11. UserRoleRepository With Session

The same concept applies to `UserRoleRepository`.

```ts
import { ClientSession } from 'mongoose';

export class UserRoleRepository implements IUserRoleRepository {
  constructor(
    private readonly session: ClientSession
  ) {}

  async createUserRole(data: {
    userId: string;
    roleId: string;
  }): Promise<UserRole> {
    const [userRoleDocument] = await UserRoleModel.create(
      [data],
      {
        session: this.session,
      }
    );

    // Map document to domain entity...
  }
}
```

Now both repositories use:

```text
Same Session
     │
     ├── UserRepository
     │
     └── UserRoleRepository
```

Therefore MongoDB can commit or roll back both operations together.

---

# 12. Dependency Injection

The factory is responsible for wiring the dependencies.

```text
UserFactory
    │
    ├── MongooseUserUnitOfWork
    │
    ├── Argon2PasswordHasher
    │
    └── CreateUserUseCase
```

Example:

```ts
const unitOfWork = new MongooseUserUnitOfWork();

const passwordHasher = new Argon2PasswordHasher();

const createUserUseCase = new CreateUserUseCase(
  unitOfWork,
  passwordHasher
);
```

The important point is that the factory decides the concrete implementations.

The use case only depends on:

```ts
IUserUnitOfWork
IPasswordHasher
```

---

# 13. Complete Flow

The complete request flow is:

```text
                    PRESENTATION
                         │
                         ▼
                   UserController
                         │
                         ▼
                  CreateUserUseCase
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
       IUserUnitOfWork       IPasswordHasher
              │                     │
              ▼                     ▼
 MongooseUserUnitOfWork    Argon2PasswordHasher
              │
              ▼
       MongoDB Session
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
 UserRepository  UserRoleRepository
       │             │
       └──────┬──────┘
              ▼
           MongoDB
```

Runtime flow:

```text
POST /api/users
       │
       ▼
UserController
       │
       ▼
CreateUserUseCase.execute()
       │
       ├── Hash password
       │
       ▼
unitOfWork.execute()
       │
       ├── startSession()
       ├── startTransaction()
       │
       ├── Create User
       │
       ├── Create UserRole
       │
       ├── commitTransaction()
       │
       └── endSession()
       │
       ▼
Return User
```

If something fails:

```text
Create User       ✅
       │
       ▼
Create UserRole   ❌
       │
       ▼
abortTransaction()
       │
       ▼
User creation rolled back
```

---

# 14. Why Unit of Work Instead of a Separate Transaction Port?

A separate transaction abstraction such as:

```ts
ITransaction
```

only represents:

```ts
execute(operation)
```

But in our case, the repositories also need access to the **same transaction/session**.

The Unit of Work solves both problems:

```text
Unit of Work
    │
    ├── Controls transaction
    │
    ├── Creates transaction-aware repositories
    │
    └── Gives those repositories to the use case
```

Therefore, for this design, we don't need:

```text
ITransaction
MongooseTransaction
```

Instead:

```text
IUserUnitOfWork
MongooseUserUnitOfWork
```

The Unit of Work owns the transaction boundary.

---

# 15. Key Principle

The most important rule is:

> The use case decides **what operations must happen atomically**. The Unit of Work defines the **transaction boundary**, and infrastructure decides **how that transaction is implemented**.

For password hashing:

```text
CreateUserUseCase
      ↓
IPasswordHasher
      ↓
Argon2PasswordHasher
      ↓
Argon2
```

For database transactions:

```text
CreateUserUseCase
      ↓
IUserUnitOfWork
      ↓
MongooseUserUnitOfWork
      ↓
MongoDB Session
      ↓
UserRepository + UserRoleRepository
```

The final architecture keeps the application layer independent from Mongoose while ensuring that `User` and `UserRole` use the same MongoDB transaction.
