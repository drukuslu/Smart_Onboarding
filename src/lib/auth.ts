import { NextAuthConfig } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import { Provider } from 'next-auth/providers'

// Microsoft provider setup
const MicrosoftProvider: Provider = {
  id: 'microsoft',
  name: 'Microsoft',
  type: 'oauth',
  authorization: {
    url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    params: { scope: 'openid profile email' }
  },
  token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  userinfo: 'https://graph.microsoft.com/v1.0/me',
  profile(profile) {
    return {
      id: profile.id,
      name: profile.displayName,
      email: profile.mail ?? profile.userPrincipalName,
      image: null
    }
  },
  clientId: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    }),
    MicrosoftProvider
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify'
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

      if (isProtectedRoute && !isLoggedIn) {
        return false
      }

      return true
    }
  },
  session: {
    strategy: 'database'
  },
  secret: process.env.NEXTAUTH_SECRET
}
