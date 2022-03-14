import { ApolloServer, gql } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import http from "http";
import express from "express";
import cors from "cors";
import { search, stream } from 'play-dl';

const app = express();
app.use(cors());
app.use(express.json());
const httpServer = http.createServer(app);

const typeDefs = gql`
  type Song {
    ref: String!
    title: String!
    url: String!
    thumbnail: String!
    duration: String!,
  }

  type SongRef {
    url: String!
  }

  type Query {
    songs(term: String!, limit: Int): [Song]!
    songRef(ref: String!): SongRef!
  }
`;

const resolvers = {
  Query: {
    songs: async (root, { term, limit }) => {
      const songs = await search(term, { source: { youtube: "video" }, limit: limit || 5 });

      return songs.map(async (song) => {
        const { url } = await stream(song.url);

        return {
          ref: song.url,
          title: song.title,
          thumbnail: song.thumbnails[0].url,
          duration: song.durationInSec,
          url,
        }
      });
    },
    songRef: async (root, { ref }) => {
      const { url } = await stream(ref);

      return { url };
    }
  }
};

const startApolloServer = async (app, httpServer) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();
  server.applyMiddleware({ app });
}

startApolloServer(app, httpServer);

export default httpServer;