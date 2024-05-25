const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const { graphqlUploadExpress, GraphQLUpload } = require('graphql-upload');
const { finished } = require('stream/promises');

const prisma = new PrismaClient();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const typeDefs = gql`
  scalar Upload

  type Query {
    images: [Image]
  }

  type Mutation {
    uploadFile(file: Upload!): Image!
  }

  type Image {
    id: Int!
    filename: String!
    mimetype: String!
    encoding: String!
    path: String!
  }
`;

const resolvers = {
  Upload: GraphQLUpload, 
  Query: {
    images: async () => await prisma.image.findMany(),
  },
  Mutation: {
    uploadFile: async (parent, { file }) => {
      const { createReadStream, filename, mimetype, encoding } = await file;
      const stream = createReadStream();
      const filepath = path.join(__dirname, 'uploads', filename);
      const out = fs.createWriteStream(filepath);
      stream.pipe(out);
      await finished(out);

      
      const image = await prisma.image.create({
        data: {
          filename,
          mimetype,
          encoding,
          path: filepath,
        },
      });

      return image;
    },
  },
};

const app = express();
app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 })); // 10 MB
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: { prisma },
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: 5000 }, () =>
    console.log(`🚀 Server ready at http://localhost:5000${server.graphqlPath}`)
  );
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
