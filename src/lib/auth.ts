import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Request profile + email so we always get name/picture/locale
      authorization: {
        params: { scope: "openid email profile" },
      },
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // ── Sync SSO profile into ExternalProfile on every sign-in ──────
    // This keeps ExternalProfile as the live source of truth for data
    // fetched from the provider, separate from what the user edits.
    async signIn({ user, account, profile }) {
      // Credentials sign-in: no external profile to sync
      if (!account || account.type === "credentials" || !profile) {
        return true;
      }

      // Normalise across providers — Google and Apple return different shapes
      const p = profile as Record<string, unknown>;
      const normalised = {
        email: profile.email ?? null,
        name: (p.name as string) ?? null,
        givenName: (p.given_name as string) ?? null,
        familyName: (p.family_name as string) ?? null,
        image: (p.picture as string) ?? (p.image as string) ?? null,
        locale: (p.locale as string) ?? null,
      };

      await prisma.externalProfile.upsert({
        where: {
          userId_provider: {
            userId: user.id!,
            provider: account.provider,
          },
        },
        create: {
          userId: user.id!,
          provider: account.provider,
          providerId: account.providerAccountId,
          ...normalised,
          rawData: profile as object,
        },
        update: {
          ...normalised,
          rawData: profile as object,
          syncedAt: new Date(),
        },
      });

      // Back-fill User.name / User.image only when the user has not
      // manually set them (nameSource / imageSource === USER means
      // the user wrote it themselves — don't overwrite).
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { nameSource: true, imageSource: true },
      });

      if (dbUser) {
        const patch: Record<string, unknown> = {};

        if (dbUser.nameSource !== "USER" && normalised.name) {
          patch.name = normalised.name;
          patch.nameSource = account.provider.toUpperCase(); // "GOOGLE" | "APPLE"
        }
        if (dbUser.imageSource !== "USER" && normalised.image) {
          patch.image = normalised.image;
          patch.imageSource = account.provider.toUpperCase();
        }

        if (Object.keys(patch).length > 0) {
          await prisma.user.update({ where: { id: user.id }, data: patch });
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/onboarding",
  },
};
