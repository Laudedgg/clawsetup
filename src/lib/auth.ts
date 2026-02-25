import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { cookies } from 'next/headers';
import { connectDB } from './db';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import { generateReferralCode } from './referral';

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const authOptions: NextAuthOptions = {
  // We skip the MongoDB adapter and use JWT sessions directly
  // This simplifies deployment and avoids build-time MongoDB connections
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        await connectDB();

        const user = await UserModel.findOne({ email: credentials.email.toLowerCase() });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        const adminEmails = parseAdminEmails();
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          tier: user.tier,
          paymentStatus: user.paymentStatus,
          isAdmin: !!user.isAdmin || adminEmails.includes(user.email.toLowerCase()),
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth - create user if doesn't exist
      if (account?.provider === 'google' && user.email) {
        try {
          await connectDB();
          const existingUser = await UserModel.findOne({ email: user.email.toLowerCase() });

          if (!existingUser) {
            // Check for referral cookie
            let referredBy: string | undefined;
            try {
              const cookieStore = await cookies();
              const refCode = cookieStore.get('ref_code')?.value;
              if (refCode) {
                const referrer = await UserModel.findOne({ referralCode: refCode }).lean();
                if (referrer) referredBy = refCode;
              }
            } catch { /* cookies() may not be available in all contexts */ }

            await UserModel.create({
              email: user.email.toLowerCase(),
              name: user.name,
              googleId: account.providerAccountId,
              tier: 'free',
              paymentStatus: 'pending',
              ...(referredBy && { referredBy }),
            });
          } else if (!existingUser.googleId) {
            // Link Google account to existing user
            existingUser.googleId = account.providerAccountId;
            await existingUser.save();
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      const adminEmails = parseAdminEmails();

      if (user) {
        token.id = (user as any).id;
        token.tier = (user as any).tier || 'free';
        token.paymentStatus = (user as any).paymentStatus;
        token.isAdmin = (user as any).isAdmin || (token.email ? adminEmails.includes(token.email.toLowerCase()) : false) || false;
      }

      // Always refresh tier/admin/paymentStatus from DB when we have an email.
      // This ensures users instantly see paid features after webhook updates.
      if (token.email) {
        try {
          await connectDB();
          const dbUser = await UserModel.findOne({ email: token.email.toLowerCase() });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.tier = dbUser.tier;
            token.paymentStatus = dbUser.paymentStatus;
            token.isAdmin = !!dbUser.isAdmin || adminEmails.includes(dbUser.email.toLowerCase());
            token.solanaWallet = dbUser.solanaWallet || null;

            // Lazy-generate referral code for users that don't have one yet
            if (!dbUser.referralCode) {
              try {
                let code: string;
                let attempts = 0;
                do {
                  code = generateReferralCode();
                  attempts++;
                } while (attempts < 5 && (await UserModel.exists({ referralCode: code })));
                dbUser.referralCode = code;
                await dbUser.save();
              } catch { /* silent — will retry next request */ }
            }
          }
        } catch (error) {
          console.error('Error fetching user in jwt callback:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).tier = (token as any).tier;
        (session.user as any).paymentStatus = (token as any).paymentStatus;
        (session.user as any).isAdmin = (token as any).isAdmin || false;
        (session.user as any).solanaWallet = (token as any).solanaWallet || null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
