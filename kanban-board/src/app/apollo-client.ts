'use client'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

export function makeClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: 'https://countries.trevorblades.com/' }),
    cache: new InMemoryCache(),
  })
}