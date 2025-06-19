/**
 *
 * @param email Email string to validate
 * @returns true if email is valid, false otherwise
 */
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !!email && emailRegex.test(email) && email.length < 31;
};

/**
 *
 * @param password Password string to validate
 * @returns true if password is valid, false otherwise
 */
export const isValidPassword = (password: string) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
  return !!password && passwordRegex.test(password) && password.length > 7;
};

/**
 *
 * @param name Name string to validate
 * @returns true if name is valid, false otherwise
 */
export const isValidName = (name: string) => !!name && name.length < 31;

/**
 *
 * @param entity Entity string to validate
 * @returns true if entity is valid, false otherwise
 */
export const isValidEntity = (entity: string) => !!entity && entity.length < 51;

/**
 *
 * @param details Details string to validate
 * @returns true if details is valid, false otherwise
 */
export const isValidDetails = (details: string) => details.length < 61;
