import * as setup from "../../__tests__/setup";
import bcrypt from "bcryptjs";


import { UserModel } from "../../models";
import { addMovie, deleteMovie } from "../Movies/movies";
import { login } from "../Authentication/auth";
import { MovieModel } from "../../models/movie";
import { AddMovieValidationError } from "../Movies/moviesValidator";
import { UserInputError } from "apollo-server";

let testMongo: setup.TestMongoConn;

beforeEach(async () => {
  testMongo = await setup.beforeEach();
});

afterEach(() => setup.afterEach(testMongo));

describe(("Test Add Movie"), () => {
  it("should create new user object for successful registration", async () => {
    
    const user = new UserModel({
      username: "userTest",
      password: await bcrypt.hash("123", 10),
      email: "johndoe@fakemail.com",
    });
    await user.save();
    
    const loginResponse = await login(undefined, {
      loginInput: {
        username: "userTest",
        password: "123",
      },
    });
    const context = { req: { headers: {authorization :  `Bearer ${loginResponse.token}`}} }
    
    const newMovie = await addMovie(undefined, {
      addMovieInput: {
        id: "",
        title: "Test Movie",
        actors: ["Actor 1"],
        releaseDate: "2006",
        duration: 5545455,
      },
    }, context);
    
    expect(newMovie.title).toEqual("Test Movie");
    
    const movie = await MovieModel.findOne({ _id: newMovie.id });
    expect(movie).toBeDefined();
  });
  
  it("Should throw an error if title is empty", async () => {
    let error
    
    const user = new UserModel({
      username: "userTest",
      password: await bcrypt.hash("123", 10),
      email: "johndoe@fakemail.com",
    });
    await user.save();
    
    const loginResponse = await login(undefined, {
      loginInput: {
        username: "userTest",
        password: "123",
      },
    });
    const context = { req: { headers: {authorization :  `Bearer ${loginResponse.token}`}} }
    
    try {
      await addMovie(undefined, {
        addMovieInput: {
          id: "",
          title: "",
          actors: ["Actor 1"],
          releaseDate: "2006",
          duration: 5545455,
        },
      }, context);
    }
    catch (e) {
      error = e
    }
    const errors: AddMovieValidationError = {
      title: "Title must not be empty",
      actors: "Cast cannot be empty",
      releaseDate: "Release date must not be empty",
      duration: "Movie must have a duration",
    };
    const compareError = new UserInputError("Add Movie Input Errors",
      { errors },
    );
  
    expect(error).toEqual(compareError);
  });
});

describe(("Delete Movie"), () => {
  it("Should not find document after deleting it", async () => {
    
    const user = new UserModel({
      username: "userTest",
      password: await bcrypt.hash("123", 10),
      email: "johndoe@fakemail.com",
    });
    await user.save();
    
    const loginResponse = await login(undefined, {
      loginInput: {
        username: "userTest",
        password: "123",
      },
    });
    const context = { req: { headers: {authorization :  `Bearer ${loginResponse.token}`}} }
    
    const newMovie = await addMovie(undefined, {
      addMovieInput: {
        id: "",
        title: "Test Movie",
        actors: ["Actor 1"],
        releaseDate: "2006",
        duration: 5545455,
      },
    }, context);
    
    await deleteMovie(undefined,
      { movieId : newMovie.id
      }, context
    )
    
    const movie = await MovieModel.findOne({ _id: newMovie.id });
    expect(movie).toBeNull();
  });
});