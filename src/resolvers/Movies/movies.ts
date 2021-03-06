import { Movie, MovieModel, Rating } from "../../models/movie";
import { getUserInfo } from "../../auth";
import { AuthenticationError, UserInputError } from "apollo-server";
import { addMovieValidator } from "./moviesValidator";
import { PaginateOptions } from "mongoose";

interface FilterObj {
  userMovies?: boolean
  field?: string
  order?: string
}

interface PaginationParams {
  pageNumber: number
  pageSize: number
  filterObject: FilterObj
}

export interface AddMovieInput {
  id: string;
  title: string
  duration: number
  releaseDate: string
  actors: string[]
}

interface AddRatingInput {
  movieId: string,
  score: number
}

export async function getMovies(
  _: void,
  { paginationParams }: { paginationParams: PaginationParams },
  context: any,
) {
  
  const filterObj: FilterObj = paginationParams?.filterObject ? paginationParams?.filterObject : {};
  let pageNumber = 1;
  let pageSize = 20;
  
  let checkedFilter = {
    userMovies: false,
    field: "",
    order: "",
  };
  if (paginationParams) {
    if (paginationParams.filterObject) {
      checkedFilter.userMovies = (filterObj.userMovies) ? filterObj.userMovies : checkedFilter.userMovies;
      checkedFilter.field = (filterObj.field) ? filterObj.field : checkedFilter.field;
      checkedFilter.order = (filterObj.order) ? filterObj.order : checkedFilter.order;
    }
    pageNumber = (paginationParams.pageNumber) ? paginationParams.pageNumber : pageNumber;
    pageSize = (paginationParams.pageSize) ? paginationParams.pageSize : pageSize;
  }
  
  const user = getUserInfo(context);
  const query = filterObj.userMovies ? { username: user.username } : {};
  let order: number = 1;
  if (filterObj.order) {
    if (filterObj.order === "asc") {
      order = -1;
    }
  }
  let sortParam: any = { grade: 1 };
  if (filterObj.field) {
    sortParam = { [`${filterObj.field}`]: order };
  }
  try {
    const options: PaginateOptions = {
      page: pageNumber,
      sort: sortParam,
    };
    
    const paginatedResults = await MovieModel.paginate(query, options);
    const paginatedMovies: Movie[] = paginatedResults.docs;
    
    const currentPage = (paginatedResults.page) ? paginatedResults.page : pageNumber;
    return {
      movies: paginatedMovies,
      cursor: (paginatedMovies.length > 0) ? paginatedMovies[paginatedMovies.length - 1]._id : "",
      currentPage: (paginatedResults.page) ? paginatedResults.page : pageNumber,
      hasMore: (paginatedResults.pages) ? paginatedResults.pages > currentPage : false,
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
  const movieIdExist = addMovieInput.id !== "";
  if (!movieIdExist) {
    const newMovie = new MovieModel({
      ...addMovieInput,
      createdAt: new Date().toISOString(),
      ratings: [],
      ratingCount: 0,
      grade: 0,
      user: user.id,
      username: user.username,
    });
    
    const movie = await newMovie.save();
    return movie;
  } else {
    try {
      const movieToUpdate: Movie | null = await MovieModel.findById(addMovieInput.id);
      if (movieToUpdate) {
        const moviesWithMatchingNames: Movie[] = await MovieModel.find({ title: movieToUpdate.title });
        if (moviesWithMatchingNames.length === 1 && movieToUpdate.id === moviesWithMatchingNames[0].id) {
          if (movieToUpdate.user.toString() === user.id) {
            const updatedMovie: Movie | null = await MovieModel.findByIdAndUpdate(movieToUpdate.id, {
              title: addMovieInput.title,
              releaseDate: addMovieInput.releaseDate,
              actors: addMovieInput.actors,
              duration: addMovieInput.duration,
            }, { upsert: true });
            if (updatedMovie) {
              return updatedMovie;
            } else throw new Error("Could not save changes to movie")
            
          } else throw new UserInputError("User not allowed to edit this movie");
        } else throw new UserInputError("Cannot use already existing movie title");
      }
      throw new UserInputError("Could not retrieve matching movie to update");
    } catch (e) {
      throw new Error(e);
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
      movie.ratingCount = movie.ratings.length;
      
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
