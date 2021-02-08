import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserInputError } from "apollo-server";

import { Context, LoginResponse, RegisterResponse, UserInfo } from "../../types";
import { User, UserModel } from "../../models";
import config from "../../config";
import { loginFieldsValidator, registerFieldsValidator } from "./authValidators";

export interface RegisterInput {
  [key: string]: any;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  [key: string]: any;
  username: string;
  password: string;
}

function generateToken(user: User) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    config.SECRET_KEY,
    { expiresIn: "24h" },
  );
}

export async function register(
  _: void,
  { registerInput }: { registerInput: RegisterInput },
): Promise<RegisterResponse> {
  const { username, password, email } = registerInput;
  const { valid, errors } = registerFieldsValidator(registerInput);
  if (!valid) {
    throw new UserInputError("Registration Input Errors", { errors });
  }
  const existingUser: number = await UserModel.countDocuments({ username });
  const existingEmail: number = await UserModel.countDocuments({ email });
  
  if (existingUser) {
    errors.username = "Username already used!";
    throw new UserInputError("Username already used", { errors });
  }
  if (existingEmail) {
    errors.email = "Email already used!";
    throw new UserInputError("Email already used", { errors });
  }
  const hashedPassword: string = await bcrypt.hash(password, 10);
  const user: User = new UserModel({
    username,
    password: hashedPassword,
    email: email,
  });
  const newUser = await user.save();
  const token = generateToken(newUser);
  // @ts-ignore
  const userData = { ...newUser._doc };
  return {
    ...userData,
    id: user._id,
    token,
  };
}

export async function login(
  _: void,
  { loginInput }: { loginInput: LoginInput },
): Promise<LoginResponse> {
  const { username, password } = loginInput;
  const { valid, errors } = loginFieldsValidator(loginInput);
  if (!valid) {
    throw new UserInputError("Login Input Errors", { errors });
  }
  
  const user: User | null = await UserModel.findOne({ username });
  if (!user) {
    errors.general = "Username or password are incorrect";
    throw new UserInputError("Username or password are incorrect", { errors });
    ;
  }
  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    errors.general = "Username or password are incorrect";
    throw new UserInputError("Username or password are incorrect", { errors });
    ;
  }
  const token = generateToken(user);
  
  // @ts-ignore
  const userData = { ...user._doc };
  return {
    ...userData,
    id: user._id,
    token,
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
    email: user.email,
  };
}
