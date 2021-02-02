import mongoose from "mongoose";


export interface Rating {
  username: string;
  score: number;
  createdAt: string;
}

export interface Movie extends mongoose.Document {
  _id: string;
  title: string;
  runtime: number;
  releaseDate: string;
  actors: string[];
  createdAt: string;
  ratings: Rating[];
  ratingCount: number;
  avg: number;
  username: string;
  user: string;
}

const MovieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    runtime: { type: Number, required: true },
    releaseDate: { type: String, required: true },
    actors: [{ type: String, required: true }],
    ratings: [{
      username: { type: String, required: true },
      score: { type: Number, require: true },
      createdAt: { type: String, required: true }
    }],
    ratingCount: { type: Number, required: true },
    avg: { type: Number, required: true },
    createdAt: { type: String, required: true },
    username: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    
  },
  {
    versionKey: false,
  },
);

export const MovieModel = mongoose.model<Movie>("Movie", MovieSchema, "Movies");
