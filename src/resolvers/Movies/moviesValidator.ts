import { AddMovieInput } from "./movies";
import moment from "moment";

export interface AddMovieValidationError {
  title?: string
  actors?: string
  releaseDate?: string
  runtime?: string
}

export const addMovieValidator = (movieInput: AddMovieInput) => {
  const { title, actors, releaseDate, runtime } = movieInput;
  const errors: AddMovieValidationError = {};
  if (title.trim() === "") {
    errors.title = "Title must not be empty";
  }
  if (actors.length < 1) {
    errors.actors = "Movie requires actors";
  }
  if (releaseDate.trim() === "") {
    errors.releaseDate = "Release date must not be empty";
  } else {
    if (!moment(releaseDate, moment.ISO_8601, true).isValid()) {
      errors.releaseDate = "Release date must be a valid date";
    }
  }
  if (!runtime) {
    errors.runtime = "Movie must have a duration";
  }
  
  return {
    errors,
    valid: Object.keys(errors).length - 1,
  };
  
};