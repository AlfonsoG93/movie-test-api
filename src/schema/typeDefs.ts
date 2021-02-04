import gql from "graphql-tag";

const typeDefs = gql`
    type User {
        id: ID!
        username: String!
        token: String!
        email: String!
    }

    type Movie {
        id: ID!
        title: String!
        runtime: Int!
        releaseDate: String!
        actors: [String]!
        createdAt: String!
        ratings: [Rating]!
        ratingCount: Int!
        grade: Int!
        username: String!
        user: ID!
    }

    type Rating {
        username: String!
        score: Int!
        createdAt: String!
        movieTitle: String!
    }

    type NewestRating {
        rating: Rating!
        movie: String!
    }

    input RegisterInput {
        username: String!
        password: String!
        confirmPassword: String!
        email: String!
    }

    input LoginInput {
        username: String!
        password: String!
    }

    input AddMovieInput {
        title: String!
        releaseDate: String!
        runtime: Int!
        actors: [String]!
    }

    input AddRatingInput {
        movieId: ID!
        score: Int!
    }

    input FilterObj {
        userMovies: Boolean!
        field: String!
        order: String!
    }

    input PaginationParams {
        pageNumber: Int
        #            The number of results to show. Must be >= 1. Default = 20
        pageSize: Int
        #            ----
        #            If you add a cursor here, it will only return results _after_ this cursor
        #        after: String
        #            ----
        #            Filter
        filterObject: FilterObj
    }


    type MoviesConnection {
        currentPage: Int!
        cursor: String!
        hasMore: Boolean!
        movies: [Movie]!
    }

    type Query {
        currentUser: User!
        getMovies(paginationParams: PaginationParams): MoviesConnection!
        getMovie(movieId: ID!): Movie!
        me: User
    }

    type Mutation {
        register(registerInput: RegisterInput!): User!
        login(loginInput: LoginInput!): User!
        addMovie(addMovieInput: AddMovieInput!): Movie!
        deleteMovie(movieID: ID!): String!
        addRating(addRatingInput: AddRatingInput!): Movie!
    }

    type Subscription {
        newestRating: NewestRating!
    }
`;
export default typeDefs;
