import mongoose from "mongoose";
import yargs from "yargs";
import { ApolloServer, PubSub } from "apollo-server";
import typeDefs from "./schema/typeDefs";
import resolvers from "./resolvers";
import * as dotenv from "dotenv";
import findConfig from "find-config";
import config from "./config";

const pubSub = new PubSub();
const args = (mongoString: string) => yargs.option("mongo-uri", {
  describe: "Mongo URI",
  default: mongoString,
  type: "string",
  group: "Mongo",
}).argv;

async function start() {
  if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: findConfig(".env") || "" });
    config.MONGO_URI = (process.env.MONGO_CLOUD_URI) ? process.env.MONGO_CLOUD_URI : config.MONGO_URI;
    config.SECRET_KEY = (process.env.SECRET_KEY) ? process.env.SECRET_KEY : `secret`;
  }
  const dbArgs = args(config.MONGO_URI);
  try {
    await mongoose.connect(
      dbArgs["mongo-uri"]
      , {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });
    console.log("Connected to DB.");
    
    await new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => ({
        // userInfo: getUserInfo(req.headers.authorization || ""),
        req,
        pubSub,
      }),
    }).listen(config.PORT);
    console.log(`GraphQl API running on port ${config.PORT}.`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
