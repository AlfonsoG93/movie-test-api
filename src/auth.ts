import jwt from "jsonwebtoken";
import { ApolloError, AuthenticationError } from "apollo-server";
import { UserInfo } from "./types";
import config from "./config";

export function getUserInfo(context: any): UserInfo | ApolloError {
  const tokenBearer = context.req?.headers?.authorization || "";
  if (tokenBearer) {
    const token = tokenBearer.split("Bearer ")[1];
    if (token) {
      try {
        return jwt.verify(token, config.SECRET_KEY) as UserInfo;
      } catch (err) {
        throw new AuthenticationError("Invalid/Expired Token");
      }
    } else {
      throw new AuthenticationError("Authentication token must be 'Bearer [token]");
    }
  } else {
    throw new AuthenticationError("Authorization header required");
  }
}
