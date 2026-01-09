import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { success, z } from "zod";
import { usernameValidation } from "@/schemas/signUpSchema";

export async function POST(request: Request) {
    await dbConnect()

    try {
        const { username, code } = await request.json()
        const decodedUsername = decodeURIComponent(username).trim()
        const trimmedCode = code.trim(); // Trim code just to be safe
        const user = await UserModel.findOne({ username: decodedUsername })

        if (!user) {
            console.error("User not found for verification:", decodedUsername);
            return Response.json(
                {
                    success: false,
                    message: "User not found"
                }, { status: 500 }
            )
        }



        const isCodeValid = user.verifyCode === trimmedCode
        const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date()
        if (isCodeValid && isCodeNotExpired) {
            user.isVerified = true;
            await user.save()
            return Response.json(
                {
                    success: true,
                    message: "User verified successfully"
                }, { status: 200 }
            )
        } else if (!isCodeNotExpired) {
            return Response.json({
                success: false,
                message: "Code expired. Please try again for new code"
            }, { status: 400 })
        } else {
            return Response.json({
                success: false,
                message: 'Invalid code'
            }, { status: 400 })
        }


    } catch (error) {
        console.error("Error verifying user", error)
        return Response.json(
            {
                success: false,
                message: "Error verifying user"
            }, { status: 500 }
        )
    }
}