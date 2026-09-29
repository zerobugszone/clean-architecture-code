// Data required when creating a new User.
//
// Only the fields needed from the caller are included here.
// The User ID and timestamps can be generated when the User is created.
export type CreateUserData = {
    // Name of the User.
    name: string;

    // Email address of the User.
    email: string;

    // Password provided for the User.
    // It should be hashed before being stored in the database.
    password: string;
};


// Data that can be changed when updating an existing User.
//
// All fields are optional because an update may change
// only one property of the User.
export type UpdateUserData = {
    // New name of the User.
    name?: string;

    // New email address of the User.
    email?: string;
};
