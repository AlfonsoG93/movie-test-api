import { LoginInput, RegisterInput } from "./auth";

export interface RegisterValidationErrors {
  username?: string;
  email?: string;
  password?: string
  confirmPassword?: string;
}

export interface LoginValidationErrors {
  username?: string;
  password?: string;
  general?: string;
}

export const registerFieldsValidator = (input: RegisterInput) => {
  const { username, email, password, confirmPassword } = input;
  const errors: RegisterValidationErrors = {};
  if (username.trim() === "") {
    errors.username = "Username must not be empty";
  }
  if (email.trim() === "") {
    errors.email = "Email must not be empty";
  } else {
    const regEx = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
    if (!email.match(regEx)) {
      errors.email = "Email must have a valid email format";
    }
  }
  if (password.trim() === "") {
    errors.password = "Password must not be empty";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }
  
  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};

export const loginFieldsValidator = (input: LoginInput) => {
  const { username, password } = input;
  const errors: LoginValidationErrors = {};
  
  
  if (username.trim() === "") {
    errors.username = "Username must not be empty";
  }
  if (password.trim() === "") {
    errors.password = "Password must not be empty";
  }
  
  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
  
};