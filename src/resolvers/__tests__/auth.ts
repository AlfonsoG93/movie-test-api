import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as setup from "../../__tests__/setup";

import { UserModel } from "../../models";
import { UserInfo } from "../../types";
import { login, register } from "../Authentication/auth";
import { UserInputError } from "apollo-server";
import { RegisterValidationErrors } from "../Authentication/authValidators";

let testMongo: setup.TestMongoConn;

beforeEach(async () => {
  testMongo = await setup.beforeEach();
});

afterEach(() => setup.afterEach(testMongo));

describe("Test register", () => {
  it("should create new user object for successful registration", async () => {
    const response = await register(undefined, {
      username: "johndoe",
      password: "test",
      confirmPassword: "test",
      email: "johndoe@fakemail.com",
    });
    expect(response.username).toEqual("johndoe");
    
    const user = await UserModel.findOne({ _id: response.id });
    expect(user).toBeDefined();
  });
  
  it("should throw error if registering with empty values or Invalid format email", async () => {
    let error;
    try {
      await register(undefined, {
        username: "",
        password: "",
        confirmPassword: "test",
        email: "123",
      });
    } catch (e) {
      error = e;
    }
    const errors: RegisterValidationErrors = {
      username: "Username must not be empty",
      password: "Password must not be empty",
      confirmPassword: "Passwords must be match",
      email: "Email must have a valid email format",
    };
    const compareError = new UserInputError("Registration Input Errors",
      { errors },
    );
    
    expect(error).toEqual(compareError);
  });
  
  it("should throw error if registering with already used username or email", async () => {
    const user = new UserModel({
      username: "johndoe",
      password: "unencryptedPassword",
      email: "johndoe@fakemail.com",
    });
    await user.save();
    
    let error;
    try {
      await register(undefined, {
        username: "johndoe",
        password: "test",
        confirmPassword: "test",
        email: "johndoe@fakemail.com",
      });
    } catch (e) {
      error = e;
    }
    
    const registerErrors = [
      new UserInputError("Username already used!"),
      new UserInputError("Email already used!"),
    ];
    expect(registerErrors).toContain(error);
  });
  
  
  it("should throw error if registering with already used username", async () => {
    const user = new UserModel({
      username: "johndoe",
      password: "unencryptedPassword",
      email: "johndoe@fakemail.com",
    });
    await user.save();
    
    let error;
    try {
      await register(undefined, {
        username: "johndoe",
        password: "test",
        confirmPassword: "test",
        email: "johndoe@fakemail.com",
      });
    } catch (e) {
      error = e;
    }
    
    expect(error).toEqual(new UserInputError("Username already used!"));
  });
  
  it("should throw error if registering with already used email", async () => {
    const user = new UserModel({
      username: "johndoe",
      password: "unencryptedPassword",
      email: "johndoe@fakemail.com",
    });
    await user.save();
    
    let error;
    try {
      await register(undefined, {
        username: "johndoe",
        password: "test",
        confirmPassword: "test",
        email: "johndoe@fakemail.com",
      });
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(new UserInputError("Email already used!"));
  });
});

describe("Test login", () => {
  
  it("should throw error if user for username is empty", async () => {
    let error;
    try {
      await login(undefined, {
        username: "",
        password: "test",
      });
    } catch (e) {
      error = e;
    }
    const errorMessage = { username: "username must not be empty" };
    expect(error).toEqual(
      new UserInputError("Login Input Errors", { errorMessage }),
    );
  });
  
  it("should throw error if password is empty", async () => {
    let error;
    try {
      await login(undefined, {
        username: "",
        password: "test",
      });
    } catch (e) {
      error = e;
    }
    const errorMessage = { username: "password must not be empty" };
    expect(error).toEqual(
      new UserInputError("Login Input Errors", { errorMessage }),
    );
  });
  
  it("should throw error if user for password does not exist", async () => {
    let error;
    const user = new UserModel({
      username: "johndoe",
      password: await bcrypt.hash("test", 10),
    });
    await user.save();
    try {
      await login(undefined, {
        username: "johndoe2",
        password: "test",
      });
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(
      new UserInputError("Username or password are incorrect"),
    );
  });
  
  it("should throw error if password is invalid", async () => {
    const user = new UserModel({
      username: "johndoe",
      password: await bcrypt.hash("test", 10),
    });
    await user.save();
    
    let error;
    try {
      await login(undefined, {
        username: "johndoe",
        password: "test2",
      });
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(
      new UserInputError("Username or password are incorrect"),
    );
  });
  
  it("should login user and return jwt token", async () => {
    const user = new UserModel({
      username: "johndoe",
      password: await bcrypt.hash("test", 10),
    });
    await user.save();
    
    const response = await login(undefined, {
      username: "johndoe",
      password: "test",
    });
    const tokenPayload: UserInfo = jwt.decode(response.token) as UserInfo;
    expect(tokenPayload.username).toEqual("johndoe");
  });
})
;
