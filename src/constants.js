export const CLIENT = {
    NETWORK_ERROR: 'networkError',
    NO_SESSION: 'no-session',
    USERNAME_MISSING: 'Username-missing',
    REQUIRED_USERNAME: 'required-username',
    USERNAME_NOT_FOUND: 'username-not-found',
    INVALID_USERNAME: 'invalid-username',
    INVALID_EMAIL: 'invalid-email',
    USERNAME_EXISTS: 'username-exists',
};

export const SERVER = {
    AUTH_MISSING: 'auth-missing',
    AUTH_INSUFFICIENT: 'auth-insufficient',
    ACCESS_DENIED: 'access-denied',
    REQUIRED_USERNAME: 'required-username',
    USERNAME_NOT_FOUND: 'username-not-found',
    INVALID_USERNAME: 'invalid-username',
    INVALID_EMAIL: 'invalid-email',
    USERNAME_EXISTS: 'username-exists',
    REGISTRATION_FAILED: 'registration-failed',
    USER_NOT_FOUND: 'user-not-found',
};

export const ERROR_MESSAGES = {
    [CLIENT.NO_SESSION]: 'You are not logged in. Please log in to continue.',
    [CLIENT.NETWORK_ERROR]: 'Trouble connecting to the network. Please try again!',
    [CLIENT.REQUIRED_USERNAME]: 'Username is required.',
    [CLIENT.USERNAME_MISSING]: 'Username can not be empty.',
    [CLIENT.USERNAME_NOT_FOUND]: 'Username not found. Please sign up first.',
    [CLIENT.INVALID_USERNAME]: 'Username must be 2-20 characters and contain only letters, numbers, or underscores.',
    [CLIENT.INVALID_EMAIL]: 'Invalid email format.',
    [CLIENT.USERNAME_EXISTS]: 'User already exists.',

    [SERVER.AUTH_MISSING]: 'Please log in to continue.',
    [SERVER.AUTH_INSUFFICIENT]: 'User not allowed.',
    [SERVER.ACCESS_DENIED]: 'User not allowed.',
    [SERVER.REQUIRED_USERNAME]: 'Username is required.',
    [SERVER.USERNAME_NOT_FOUND]: 'Username not found. Please sign up first.',
    [SERVER.INVALID_USERNAME]: 'Username must be 2-20 characters and contain only letters, numbers, or underscores.',
    [SERVER.INVALID_EMAIL]: 'Invalid email format.',
    [SERVER.USERNAME_EXISTS]: 'Username already taken.',
    [SERVER.REGISTRATION_FAILED]: 'Registration failed. Please try again.',
    [SERVER.USER_NOT_FOUND]: 'User not registered. Please register first.',

    default: 'Something went wrong. Please try again.',
};

export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: "Login successful!",
    SIGNUP_SUCCESS: "Sign up successful! You can now log in.",
};
