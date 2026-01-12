import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import AzureADProvider from "next-auth/providers/azure-ad";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";


export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials: any): Promise<any> {
                await dbConnect();
                try {
                    const user = await UserModel.findOne({
                        $or: [{ email: credentials.identifier }, { username: credentials.identifier }],
                    });
                    if (!user) {
                        throw new Error("No user found")
                    }
                    if (!user.isVerified) {
                        throw new Error("Please verify your account before login")
                    }
                    const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password)
                    if (isPasswordCorrect) {
                        return user
                    } else {
                        throw new Error('Pasword is not correct.')
                    }


                } catch (err: any) {
                    throw new Error(err.message)
                }

            },
        }),
        GithubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || "",
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    _id: profile.sub // Temporary ID mapping to satisfy type
                }
            }
        }),
        AppleProvider({
            clientId: process.env.APPLE_ID || "",
            clientSecret: process.env.APPLE_SECRET || "",
        }),
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID || "",
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
            tenantId: process.env.AZURE_AD_TENANT_ID,
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID || "",
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'credentials') return true;
            if (['github', 'google', 'apple', 'azure-ad', 'facebook'].includes(account?.provider || '')) {
                await dbConnect();
                try {
                    console.log("OAuth signIn callback started for:", user.email, "Provider:", account?.provider);
                    const existingUser = await UserModel.findOne({ email: user.email });
                    if (!existingUser) {
                        console.log("No existing user found. Creating new user for:", user.email);
                        // Create new user with temporary username
                        const newUser = new UserModel({
                            email: user.email,
                            username: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                            image: user.image,
                            isVerified: true,
                            isAcceptingMessages: true,
                            isOnboarded: false,
                            messages: [],
                        });
                        await newUser.save();
                        console.log("New user saved successfully.");
                    } else {
                        console.log("Existing user found:", existingUser.email);
                        // Update image if it has changed or is missing
                        if (user.image && existingUser.image !== user.image) {
                            existingUser.image = user.image;
                            await existingUser.save();
                            console.log("User image updated.");
                        }
                    }
                    return true;
                } catch (error) {
                    console.error("Error saving user during OAuth signin:", error);
                    return false;
                }
            }
            return true;
        },
        jwt: async ({ token, user, trigger, session }) => {
            if (user) {
                // For OAuth, user._id might not be available immediately in the `user` object passed from provider.
                // We need to ensure we have the database user.
                await dbConnect();
                const dbUser = await UserModel.findOne({ email: user.email });

                if (dbUser) {
                    token._id = dbUser._id.toString();
                    token.isVerified = dbUser.isVerified;
                    token.isAcceptingMessages = dbUser.isAcceptingMessages;
                    token.username = dbUser.username;
                    token.isOnboarded = dbUser.isOnboarded;
                    token.picture = dbUser.image || user.image;
                }
            }

            if (trigger === "update" && session) {
                // Handle updates to the session (e.g., from client-side update() call)
                // The session object here might match the structure passed to update()
                token.isOnboarded = session.user?.isOnboarded ?? session.isOnboarded ?? token.isOnboarded;
                token.username = session.user?.username ?? session.username ?? token.username;
                token.picture = session.user?.image ?? session.image ?? token.picture;
            }

            return token
        },
        session: async ({ session, token }) => {
            if (token) {
                session.user._id = token._id;
                session.user.isVerified = token.isVerified;
                session.user.isAcceptingMessages = token.isAcceptingMessages;
                session.user.username = token.username;
                session.user.isOnboarded = token.isOnboarded;
                session.user.image = token.picture;
            }
            return session
        }
    },
    pages: {
        signIn: "/sign-in",
    },
    session: {
        strategy: "jwt"
    },
    secret: process.env.NEXT_PUBLIC_SECRET,
};