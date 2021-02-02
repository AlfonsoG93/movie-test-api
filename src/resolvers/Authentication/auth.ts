import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserInputError } from "apollo-server";

import { Context, LoginResponse, RegisterResponse, UserInfo } from "../../types";
import { User, UserModel } from "../../models";
import config from "../../config";
import { loginFieldsValidator, registerFieldsValidator } from "./authValidators";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

function generateToken(user: User) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email
    },
    config.SECRET_KEY,
    { expiresIn: "24h"}
  );
}
export async function register(
  _: void,
  { registerInput }: { registerInput: RegisterInput }
): Promise<RegisterResponse> {
  const { username, password, email } = registerInput;
  const { valid, errors } = registerFieldsValidator(registerInput);
  if (!valid) {
    throw new UserInputError("Registration Input Errors", { errors });
  }
  const existingUser: number = await UserModel.countDocuments({ username });
  const existingEmail: number = await UserModel.countDocuments({ email });
  
  if (existingUser) {
    throw new UserInputError("Username Taken", {
      errors: {
        username: "Username already used!",
      },
    });
  }
  if (existingEmail) {
    throw new UserInputError("Email Taken", {
      errors: {
        username: "Email already used!",
      },
    });
  }
  const hashedPassword: string = await bcrypt.hash(password, 10);
  const user: User = new UserModel({
    username,
    password: hashedPassword,
    email: email
  });
  const newUser = await user.save();
  const token = generateToken(newUser);
  // @ts-ignore
  const userData = {...newUser._doc}
  return {
    ...userData,
    id: user._id,
    token
  };
}

export async function login(
  _: void,
  { loginInput }: { loginInput: LoginInput }
): Promise<LoginResponse> {
  const { username, password } = loginInput;
  const { valid, errors } = loginFieldsValidator(loginInput);
  if (!valid) {
    throw new UserInputError("Login Input Errors", { errors });
  }
  
  const loginAuthError = new UserInputError("Username or password are incorrect");
  
  const user: User | null = await UserModel.findOne({ username });
  if (!user) {
    throw loginAuthError;
  }
  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    throw loginAuthError;
  }
  const token = generateToken(user)
  
  // @ts-ignore
  const userData = {...user._doc}
  return {
    ...userData,
    id: user._id,
    token
  };
}

export async function currentUser(_: void, _args: any, ctx: Context): Promise<UserInfo> {
  const { userInfo } = ctx;
  if (!userInfo) {
    throw new Error("Not authenticated!");
  }
  const user: User | null = await UserModel.findOne({ _id: userInfo.id });
  if (!user) {
    throw new Error("Not authenticated!");
  }
  return {
    id: user._id,
    username: user.username,
    email: user.email
  };
}
