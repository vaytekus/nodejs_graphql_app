const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type RootQuery {
    login(email: String!, password: String!): AuthData!
    posts(page: Int!): PostData!
    post(id: ID!): Post!
  }

  type RootMutation {
    createUser(UserInput: UserInput!): User!
    createPost(PostInput: PostInput!): Post!
    updatePost(id: ID!, PostInput: PostInput!): Post!
    deletePost(id: ID!): Boolean!
  }

  input UserInput {
    email: String!
    password: String!
    name: String!
  }

  input PostInput {
    title: String!
    content: String!
    imageUrl: String!
  }

  type AuthData {
    token: String!
    userId: String!
  }

  type User {
    _id: ID!
    email: String!
    password: String
    name: String!
    status: String!
    posts: [Post!]!
  }

  type PostData {
    posts: [Post!]!
    totalPosts: Int!
  }

  type Post {
    _id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);