import { currentUser, login, register } from "./Authentication/auth";
import { addMovie, addRating, deleteMovie, getMovie, getMovies, getNewestRating } from "./Movies/movies";
import { Movie } from "../models/movie";

const resolverMap = {
  Movie: {
    // Score Calculations
    ratingCount: (parent: Movie) => parent.ratings.length
    ,
    avg: (parent: Movie) => {
      let sum = 0;
      if (parent.ratingCount > 0) {
        for (let rating of parent.ratings) {
          sum = rating.score;
        }
        return sum / parent.ratingCount;
      } else {
        return 0;
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
