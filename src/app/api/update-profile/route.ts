import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";
import bcrypt from 'bcryptjs';
import { usernameValidation } from "@/schemas/signUpSchema"; // Reuse validation schema

export async function POST(request: Request) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const user = session?.user as User;

    if (!session || !user) {
        return Response.json(
            {
                success: false,
                message: "Not Authenticated",
            },
            { status: 401 }
        );
    }

    try {
        const { username, password, image } = await request.json();

        let userId = user._id;

        // Fallback: If userId is missing from session, try to find by email
        if (!userId && user.email) {
            const dbUser = await UserModel.findOne({ email: user.email });
            if (dbUser) {
                userId = dbUser._id.toString();
            }
        }

        if (!userId) {
            return Response.json(
                {
                    success: false,
                    message: "User ID not found",
                },
                { status: 401 }
            );
        }

        const updateData: any = {};

        // Handle Username Update
        if (username) {
            // validate username
            const result = usernameValidation.safeParse(username);

            if (!result.success) {
                const usernameErrors = result.error.format()._errors || [];
                return Response.json(
                    {
                        success: false,
                        message: usernameErrors?.length > 0 ? usernameErrors.join(', ') : 'Invalid username',
                    },
                    { status: 400 }
                );
            }

            // Check if username is taken (if it's different from current)
            if (username !== user.username) {
                const existingUser = await UserModel.findOne({ username, isVerified: true });
                if (existingUser) {
                    return Response.json(
                        {
                            success: false,
                            message: "Username is already taken",
                        },
                        { status: 400 }
                    );
                }
            }
            updateData.username = username;
        }

        // Handle Password Update
        if (password) {
            if (password.length < 6) {
                return Response.json(
                    {
                        success: false,
                        message: "Password must be at least 6 characters",
                    },
                    { status: 400 }
                );
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        // Handle Image Update
        if (image) {
            updateData.image = image;
        }

        if (Object.keys(updateData).length === 0) {
            return Response.json(
                {
                    success: false,
                    message: "No changes provided",
                },
                { status: 400 }
            );
        }

        // Update User
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return Response.json(
                {
                    success: false,
                    message: "User not found to update",
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                message: "Profile updated successfully",
                user: updatedUser
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error updating profile:", error);
        return Response.json(
            {
                success: false,
                message: "Error updating profile",
            },
            { status: 500 }
        );
    }
}
