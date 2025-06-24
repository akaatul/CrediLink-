import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-google-client-secret",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "demo-facebook-client-id",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "demo-facebook-client-secret",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "demo-github-client-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "demo-github-client-secret",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // We're using Firebase Auth directly in the AuthContext
        // This is just a fallback for NextAuth integration
        if (credentials?.email && credentials?.password) {
          return {
            id: "firebase-user",
            name: "Firebase User",
            email: credentials.email,
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to token
      if (user) {
        token.id = user.id;
        token.userType = (user as any).userType || "student";
      }
      return token;
    },
    async session({ session, token }) {
      // Add user info to session
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).userType = token.userType;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "demo-next-auth-secret",
});

export { handler as GET, handler as POST }; 