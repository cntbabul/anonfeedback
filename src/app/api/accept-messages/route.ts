import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth"

export async function POST(request: Request) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return Response.json({
            success: false,
            message: "User not authenticated"
        }, { status: 401 })
    }

    const user: User = session.user as User;
    const userId = user._id;
    const { acceptMessage } = await request.json();
    try {
        const updatedUser = await UserModel.findByIdAndUpdate(userId, { isAcceptingMessages: acceptMessage }, { new: true });
        if (!updatedUser) {
            return Response.json({
                success: false,
                message: "User not found"
            }, { status: 401 })
        }
        return Response.json({
            success: true,
            message: "User status to accept messages updated successfully",
            updatedUser
        }, { status: 200 })
    } catch (error) {
        console.log("Failed to update to user status to accept messages", error);
        return Response.json({
            success: false,
            message: "Failed to update to user status to accept messages"
        }, { status: 500 })
    }
}

export async function GET(request: Request) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return Response.json({
            success: false,
            message: "User not authenticated"
        }, { status: 401 })
    }

    const user: User = session.user as User;
    const userId = user._id;
    try {
        const foundUser = await UserModel.findById(userId);
        if (!foundUser) {
            return Response.json({
                success: false,
                message: "User not found"
            }, { status: 401 })
        }
        return Response.json({
            success: true,
            isAcceptingMessages: foundUser.isAcceptingMessages,
            message: "User fetched successfully",
            foundUser
        }, { status: 200 })
    } catch (error) {
        console.log("Failed to fetch user", error);
        return Response.json({
            success: false,
            message: "Failed to fetch users"
        }, { status: 500 })
    }
}


