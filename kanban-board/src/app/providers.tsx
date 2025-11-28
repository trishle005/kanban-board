'use client'

import type { ReactNode } from 'react'
import { NhostProvider } from '@nhost/react'
import { NhostApolloProvider } from '@nhost/react-apollo'
import { nhost } from '@/lib/nhost'

export default function Providers({ children }: { children?: ReactNode }) {
  return (
    <NhostProvider nhost={nhost}>
      <NhostApolloProvider nhost={nhost}>
        {children}
      </NhostApolloProvider>
    </NhostProvider>
  )
}
