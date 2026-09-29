// Defines the properties/data that a User entity contains.
export interface UserProps {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Represents the User as a Domain Entity.
export class User {
  // Stores the User's internal state.
  // "private" prevents outside code from directly modifying the data.
  private props: UserProps;

  // Constructor receives the initial User data when we use:
  // new User({ ... })
  constructor(props: UserProps) {
    // Store the provided data inside the User entity.
    this.props = props;
  }

  // Creates a NEW User entity.
  //
  // Use this when the user is being created for the first time,
  // for example during user registration.
  //
  // This is the place where you can apply rules that are specific
  // to creating a new User, such as generating an ID, setting
  // createdAt/updatedAt, or validating initial values.
  static create(props: UserProps): User {
    return new User(props);
  }

  // Reconstructs an EXISTING User entity.
  //
  // Use this when User data already exists in the database and
  // the repository is loading it back into the domain.
  //
  // It does NOT create a new database record.
  // It simply rebuilds the User domain entity from persisted data.
  //
  // Usually, the data here already contains:
  // - existing ID
  // - existing createdAt
  // - existing updatedAt
  // - existing password
  // - existing name/email
  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  //@@Getter
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }
}
