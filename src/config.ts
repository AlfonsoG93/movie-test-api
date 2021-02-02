interface Config {
  PORT: number;
  MONGO_URI: string;
  SECRET_KEY: string;
  DB_NAME: string;
}

const DB_NAME = "movies";
const config: Config = {
  PORT: 5000,
  MONGO_URI: `mongodb://localhost:27017/${DB_NAME}`,
  SECRET_KEY: "",
  DB_NAME: DB_NAME,
};
export default config;

