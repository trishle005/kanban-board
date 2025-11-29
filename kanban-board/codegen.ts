import type { CodegenConfig } from '@graphql-codegen/cli'

const endpoint =
  'https://ekdxykpnouttbmxytgfp.hasura.us-west-2.nhost.run/v1/graphql'

const config: CodegenConfig = {
  schema: {
    [endpoint]: {
      headers: {
        'x-hasura-admin-secret': process.env.CODEGEN_HASURA_ADMIN_SECRET || ''
      }
    }
  },
  documents: ['src/graphql/**/*.graphql'],
  generates: {
    'src/graphql/__generated__/': {
      preset: 'client',
      plugins: [],
      config: {
        scalars: {
          uuid: 'string',
          timestamptz: 'string',
          numeric: 'number',
          jsonb: 'Record<string, any>',
          citext: 'string'
        },
        allowPartialOutputs: false
      }
    }
  },
  ignoreNoDocuments: false
}

export default config
