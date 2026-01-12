import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { z } from 'zod';
import { usernameValidation } from '@/schemas/signUpSchema';

const UsernameSchema = z.object({
    username: usernameValidation,
});

export async function POST(request: Request) {
    await dbConnect();

    try {
        const session = await getServerSession(authOptions);
        const user = session?.user;

        if (!session || !user) {
            return Response.json(
                { success: false, message: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { username } = await request.json();

        const result = UsernameSchema.safeParse({ username });

        if (!result.success) {
            const usernameErrors = result.error.format().username?._errors || [];
            return Response.json(
                {
                    success: false,
                    message: usernameErrors.length > 0 ? usernameErrors.join(', ') : 'Invalid parameters',
                },
                { status: 400 }
            );
        }

        const existingUserVerifiedByUsername = await UserModel.findOne({
            username,
            isVerified: true,
        });

        if (existingUserVerifiedByUsername) {
            return Response.json(
                {
                    success: false,
                    message: 'Username is already taken',
                },
                { status: 400 }
            );
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            user._id,
            {
                username: username,
                isOnboarded: true,
            },
            { new: true }
        );

        if (!updatedUser) {
            return Response.json(
                {
                    success: false,
                    message: 'User not found',
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                message: 'Username updated successfully',
                user: updatedUser,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating profile:', error);
        return Response.json(
            {
                success: false,
                message: 'Error updating profile',
            },
            { status: 500 }
        );
    }
}
