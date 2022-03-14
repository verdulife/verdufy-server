import { ApolloServer, gql } from "apollo-server";
import { search, stream } from 'play-dl';

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

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await server.listen();

console.log(`🚀 Server ready at ${url}`);