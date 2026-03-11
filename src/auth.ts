import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { syncConfiguredAdmin } from "@/lib/configured-admin";
import { loginSchema } from "@/lib/validators";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        recaptchaToken: { label: "reCAPTCHA Token", type: "text" },
        recaptchaAction: { label: "reCAPTCHA Action", type: "text" },
      },
      async authorize(credentials) {
        const values = credentials as Record<string, unknown> | undefined;
        const recaptchaToken = typeof values?.recaptchaToken === "string" ? values.recaptchaToken : "";
        const recaptchaAction = typeof values?.recaptchaAction === "string" ? values.recaptchaAction : "";

        const recaptchaCheck = await verifyRecaptchaToken({
          token: recaptchaToken,
          action: "login_submit",
        });

        if (!recaptchaCheck.ok || recaptchaAction !== "login_submit") {
          return null;
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const { password } = parsed.data;

        await syncConfiguredAdmin(email);

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user?.password) return null;

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});

export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

