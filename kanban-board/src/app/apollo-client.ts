'use client'

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

export const makeClient = () => {
  return new ApolloClient({
    link: new HttpLink({
      uri: 'https://ekdxykpnouttbmxytgfp.hasura.us-west-2.nhost.run/v1/graphql'
    }),
    cache: new InMemoryCache(),
  })
}
