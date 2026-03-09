const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type RootQuery {
    users: [User!]!
  }
  type RootMutation {
    createUser(UserInput: UserInput!): User!
  }
  input UserInput {
    email: String!
    password: String!
    name: String!
  }
  type User {
    _id: ID!
    email: String!
    password: String
    name: String!
    status: String!
    posts: [Post!]!
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