// src/app/apollo-client.ts
'use client'
import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { nhost } from '@/lib/nhost'

export function makeClient() {
  const graphqlUrl = (nhost.graphql as any).getUrl?.() ?? (nhost.graphql as any).url

  const httpLink = createHttpLink({
    uri: graphqlUrl,
  })

  const authLink = setContext(async (_, { headers }) => {
    const token = await (nhost.auth as any).getAccessToken()
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    }
  })

  // Create WebSocket link for subscriptions
  const wsLink = new GraphQLWsLink(createClient({
    url: ((nhost.graphql as any).getUrl?.() ?? (nhost.graphql as any).url)
      .replace('https', 'wss')
      .replace('http', 'ws'),
    connectionParams: async () => {
      const token = await (nhost.auth as any).getAccessToken()
      return {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    },
  }))

  // Split links based on operation type
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      )
    },
    wsLink,
    authLink.concat(httpLink)
  )

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  })
}