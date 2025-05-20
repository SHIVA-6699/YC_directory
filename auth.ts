import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin";
import { client } from "./sanity/lib/client";
import {
  AUTHOR_BY_GITHUB_ID_QUERY,
  AUTHOR_BY_LINKEDIN_ID_QUERY,
} from "./sanity/lib/queries";
import { writeClient } from "./sanity/lib/write-client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    id?: string;
    githubId?: string;
    linkedinId?: string;
    linkedinVerified?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: { scope: "openid profile email" },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          linkedinId: profile.sub,
        };
      },
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        const { name, image, email } = user;
        const githubId = profile?.id?.toString();
        const { login, bio } = profile;

        const existingUser = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id: githubId });

        if (!existingUser) {
          await writeClient.create({
            _type: "author",
            id: githubId,
            name,
            username: login,
            email,
            image,
            bio: bio || "",
            linkedinVerified: false,
          });
        }
        return true;
      }

      if (account?.provider === "linkedin") {
        try {
          const { name, image, email, linkedinId } = user;

          // Check if user exists with this email (likely from GitHub login)
          const existingUserByEmail = await client
            .withConfig({ useCdn: false })
            .fetch(`*[_type == "author" && email == $email][0]`, { email });

          if (existingUserByEmail) {
            // Update existing user with LinkedIn data
            await writeClient
              .patch(existingUserByEmail._id)
              .set({
                linkedinId,
                linkedinVerified: true,
                linkedinProfile: profile?.preferred_username
                  ? `https://www.linkedin.com/in/${profile.preferred_username}`
                  : null,
              })
              .commit();
          } else {
            // Create new user with LinkedIn verification
            await writeClient.create({
              _type: "author",
              id: linkedinId,
              name,
              email,
              image,
              linkedinId,
              linkedinVerified: true,
              linkedinProfile: profile?.preferred_username
                ? `https://www.linkedin.com/in/${profile.preferred_username}`
                : null,
            });
          }
          return true;
        } catch (error) {
          console.error("LinkedIn sign in error:", error);
          return false;
        }
      }

      return false;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "github") {
        const githubId = profile?.id?.toString();
        token.githubId = githubId;

        const user = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id: githubId });

        token.id = user?._id;
        token.linkedinVerified = user?.linkedinVerified || false;
      }

      if (account?.provider === "linkedin") {
        const linkedinId = profile?.sub;
        token.linkedinId = linkedinId;

        const user = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_LINKEDIN_ID_QUERY, { linkedinId });

        token.id = user?._id;
        token.linkedinVerified = user?.linkedinVerified || false;
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        id: token.id,
        githubId: token.githubId,
        linkedinId: token.linkedinId,
        linkedinVerified: token.linkedinVerified,
      };
    },
  },
});
