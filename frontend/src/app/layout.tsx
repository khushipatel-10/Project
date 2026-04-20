import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased min-h-screen font-sans flex flex-col" style={{ background: '#F9F7F7', color: '#112D4E' }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
