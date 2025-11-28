'use client'

import type { ReactNode } from 'react'
import { NhostProvider } from '@nhost/react'
import { NhostApolloProvider } from '@nhost/react-apollo'
import { nhost } from '@/lib/nhost'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <NhostProvider nhost={nhost}>
      <NhostApolloProvider nhost={nhost as any}>
        {children}
      </NhostApolloProvider>
    </NhostProvider>
  )
}
