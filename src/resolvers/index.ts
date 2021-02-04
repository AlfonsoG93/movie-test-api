import { currentUser, login, register } from "./Authentication/auth";
import { addMovie, addRating, deleteMovie, getMovie, getMovies, getNewestRating } from "./Movies/movies";
import { Movie } from "../models/movie";

const resolverMap = {
  Movie: {
    // Score Calculations
    ratingCount: (parent: Movie) => parent.ratings.length
    ,
    grade: (parent: Movie) => {
      let sum = 0;
      let totalMax = 0
      if (parent.ratingCount > 0) {
        totalMax = parent.ratingCount * 5
        for (let rating of parent.ratings) {
          sum += rating.score;
        }
        return Math.round(sum * 100/totalMax);
      } else {
        return sum;
      }
      
    },
  },
  Query: {
    currentUser,
    getMovie,
    getMovies,
  },
  Mutation: {
    login,
    register,
    addMovie,
    deleteMovie,
    addRating,
  },
  Subscription: {
    newestRating: {
      subscribe: getNewestRating,
    },
  },
};

export default resolverMap;
