import { Movie, MovieModel, Rating } from "../../models/movie";
import { getUserInfo } from "../../auth";
import { AuthenticationError, UserInputError } from "apollo-server";
import { addMovieValidator } from "./moviesValidator";

interface FilterObj {
  userMovies: boolean
  field: string
  order: string
}

interface PaginationParams {
  pageSize: number
  after: string
  filterObj: FilterObj
}

export interface AddMovieInput {
  title: string
  runtime: number
  releaseDate: string
  actors: string[]
}

interface AddRatingInput {
  movieId: string,
  score: number
}

const paginateResults = (
  cursor: string,
  pageSize: number,
  results: Movie[],
) => {
  if (pageSize < 1) return [];
  
  if (!cursor) return results.slice(0, pageSize);
  const cursorIndex = results.findIndex(item => {
    // if an item has a `cursor` on it, use that, otherwise try to generate one
    let itemCursor = item._id;
    
    // if there's still not a cursor, return false by default
    return itemCursor ? cursor === itemCursor : false;
  });
  
  return cursorIndex >= 0
         ? cursorIndex === results.length - 1 // don't let us overflow
           ? []
           : results.slice(
        cursorIndex + 1,
        Math.min(results.length, cursorIndex + 1 + pageSize),
      )
         : results.slice(0, pageSize);
};

export async function getMovies(
  _: void,
  { paginationParams }: { paginationParams?: PaginationParams },
  context: any,
) {
  let pageSize = 20;
  let filterObj = {
    userMovies: false,
    order: "desc",
    field: "",
  };
  let after = "";
  if (paginationParams) {
    filterObj = (paginationParams.filterObj) ? paginationParams.filterObj : filterObj;
    pageSize = (paginationParams.pageSize) ? paginationParams.pageSize : pageSize;
    after = (paginationParams.after) ? paginationParams.after : after;
  }
  
  const user = getUserInfo(context);
  const where = filterObj.userMovies ?
    { username: user.username }
                                     : {};
  const order = (filterObj.order) ? (filterObj.order === "asc") ? 1 : -1 : -1;
  const sortParam = (filterObj.field && filterObj.order) ?
    { [`${filterObj.field}`]: order }
                                                         : {};
  try {
    const allMovies: Movie[] = await MovieModel.find(where).sort(sortParam);
    allMovies.reverse();
    const movies = paginateResults(
      after,
      pageSize,
      allMovies,
    );
    
    return {
      movies,
      cursor: movies[movies.length - 1]._id,
      // if the cursor at the end of the paginated results is the same as the
      // last item in _all_ results, then there are no more results after this
      hasMore: movies.length
               ? movies[movies.length - 1]._id !==
                 allMovies[allMovies.length - 1]._id
               : false,
    };
  } catch (err) {
    throw new Error(err);
  }
}

export async function getMovie(
  _: void,
  { movieId }: { movieId: string },
  context: any,
) {
  getUserInfo(context);
  try {
    const movie = await MovieModel.findById(movieId);
    
    if (movie) {
      return movie;
    } else {
      throw new Error("Movie not found");
    }
  } catch (err) {
    throw new Error(err);
  }
}

// Add Function to create and modify existing movies
export async function addMovie(
  _: void,
  { addMovieInput }: { addMovieInput: AddMovieInput },
  context: any,
) {
  const user = getUserInfo(context);
  const { valid, errors } = addMovieValidator(addMovieInput);
  if (!valid) {
    throw new UserInputError("Add Movie Input Errors", { errors });
  }
  
  const fetchedMovies: Movie[] = await MovieModel.find({ title: addMovieInput.title });
  if (fetchedMovies.length === 0) {
    const newMovie = new MovieModel({
      ...addMovieInput,
      createdAt: new Date().toISOString(),
      ratings: [],
      ratingCount: 0,
      avg: 0,
      user: user.id,
      username: user.username,
    });
    
    const movie = await newMovie.save();
    return movie;
  } else if (fetchedMovies.length > 0) {
    const existingMovie: Movie = fetchedMovies[0];
    if (existingMovie.username === user.username) {
      const updatedMovie = await existingMovie.update({ ...existingMovie, ...addMovieInput });
      return updatedMovie;
    } else {
      throw new UserInputError("Movie already exist");
    }
  }
}

export async function deleteMovie(
  _: void,
  { movieId }: { movieId: string },
  context: any,
) {
  const user = getUserInfo(context);
  try {
    const movie = await MovieModel.findById(movieId);
    if (movie && user.username === movie.username) {
      await MovieModel.findByIdAndDelete(movie._id);
      return "Movie deleted successfully";
    } else {
      throw new AuthenticationError("Not allowed.");
    }
  } catch (e) {
    throw new Error(e);
  }
}

export async function addRating(
  _: void,
  { addRatingInput }: { addRatingInput: AddRatingInput },
  context: any,
) {
  const user = getUserInfo(context);
  if (addRatingInput.score >= 0 && addRatingInput.score <= 5) {
    const movie: Movie | null = await MovieModel.findById(addRatingInput.movieId);
    if (movie) {
      let existingRating = movie.ratings.find((rating: Rating) => rating.username === user.username);
      let newOrUpdatedRating = true;
      if (existingRating) {
        if (addRatingInput.score > 0) {
          movie.ratings = movie.ratings.filter((rating: Rating) => rating.username !== user.username);
          movie.ratings.push({
            username: user.username,
            score: addRatingInput.score,
            createdAt: new Date().toISOString(),
          });
        } else {
          newOrUpdatedRating = false;
          movie.ratings = movie.ratings.filter((rating: Rating) => rating.username !== user.username);
        }
      } else {
        movie.ratings.push({
          username: user.username,
          score: addRatingInput.score,
          createdAt: new Date().toISOString(),
        });
      }
      // SCORE CALCULATIONS
      movie.ratingCount = movie.ratings.length;
      /*      let sum = 0;
       if (movie.ratingCount > 0) {
       for (let rating of movie.ratings) {
       sum = rating.score;
       }
       movie.avg = sum / movie.ratingCount;
       } else {
       movie.avg = 0;
       }*/
      
      await movie.save();
      
      if (newOrUpdatedRating && movie.ratings.length > 0) {
        context.pubSub.publish("NEW_RATING", {
          newestRating: {
            rating: movie.ratings[movie.ratings.length - 1],
            movie: movie.title,
          },
        });
      }
      return movie;
    } else {
      throw new UserInputError("Movie not found");
    }
  } else {
    throw new UserInputError("Invalid rating value");
  }
}

export async function getNewestRating(
  _: void,
  __: void,
  { pubSub }: { pubSub: any },
) {
  return pubSub.asyncIterator("NEW_RATING");
}
