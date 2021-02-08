import { AddMovieInput } from "./movies";
import moment from "moment";

export interface AddMovieValidationError {
  title?: string
  actors?: string
  releaseDate?: string
  duration?: string
}

export const addMovieValidator = (movieInput: AddMovieInput) => {
  const { title, actors, releaseDate, duration } = movieInput;
  const errors: AddMovieValidationError = {};
  if (title.trim() === "") {
    errors.title = "Title must not be empty";
  }
  if (actors.length < 1) {
    errors.actors = "Movie requires actors";
    if (actors.length > 1) {
      const hasDuplicate: boolean = actors.some((val, i) => actors.indexOf(val) !== i);
      if (hasDuplicate) {
        errors.actors = "Duplicate actors in cast"
      }
    }
  }
  if (releaseDate.trim() === "") {
    errors.releaseDate = "Release date must not be empty";
  } else {
    const validISODate = moment(releaseDate, moment.ISO_8601, true).isValid();
    if (validISODate) {
      const newDate = moment(releaseDate);
      const isDateAfterToday = newDate.isAfter(moment());
      if (isDateAfterToday) {
        errors.releaseDate = "Release date must be before today"
      }
    }
    else if (!validISODate) {
      errors.releaseDate = "Release date must be a valid date";
    }
  }
  if (!duration) {
    errors.duration = "Movie must have a duration";
  }
  
  return {
    errors,
    valid: Object.keys(errors).length - 1,
  };
  
};