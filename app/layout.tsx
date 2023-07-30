import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Search from './search'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Teikningar',
  description: 'Þægilegri teikningavefur',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Search />
        {children}
      </body>
    </html>
  )
}
