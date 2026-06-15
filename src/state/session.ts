let loggedInEmail = '';

export const setLoggedInEmail = (email: string): void => {
  loggedInEmail = email;
};

export const getLoggedInEmail = (): string => loggedInEmail;
