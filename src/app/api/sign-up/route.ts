import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    await dbConnect()
    try {
        const { username, email, password } = await request.json()
        // console.log(`Processing signup for username: ${username}, email: ${email}`);

        const existingUserVerifiedByUsername = await UserModel.findOne({ username, isVerified: true })
        // console.log("existingUserVerifiedByUsername result:", existingUserVerifiedByUsername);

        if (existingUserVerifiedByUsername) {
            console.error("Signup validation failed: Username already taken (verified)")
            return Response.json({
                success: false,
                message: "Username is already taken"
            }, { status: 400 })
        }
        const existingUserByEmail = await UserModel.findOne({ email })
        // console.log("existingUserByEmail result:", existingUserByEmail);

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()

        if (existingUserByEmail) {
            if (existingUserByEmail.isVerified) {
                console.error("Signup validation failed: Email already exists (verified)")
                return Response.json({
                    success: false,
                    message: "User already exists with this email"
                }, { status: 400 })
            } else {
                const hashedPassword = await bcrypt.hash(password, 10)
                existingUserByEmail.password = hashedPassword
                existingUserByEmail.verifyCode = verifyCode
                existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000)
                await existingUserByEmail.save()
            }
        } else {
            const hashedPassword = await bcrypt.hash(password, 10)
            const expiryDate = new Date()
            expiryDate.setHours(expiryDate.getHours() + 1)

            const existingUserByUsername = await UserModel.findOne({ username, isVerified: false });
            if (existingUserByUsername) {
                await existingUserByUsername.deleteOne();
            }

            const newUser = new UserModel({
                username,
                email,
                password: hashedPassword,
                verifyCode,
                verifyCodeExpiry: expiryDate,
                isVerified: false,
                isAcceptingMessages: true,
                messages: []
            })
            await newUser.save()
        }
        //send verification email
        const emailResponse = await sendVerificationEmail(
            email,
            username,
            verifyCode
        )

        if (!emailResponse.success) {
            return Response.json({
                success: true,
                message: "User registered but failed to send verification email. " + emailResponse.message
            }, { status: 200 })
        }
        return Response.json({
            success: true,
            message: 'User registered successfully. Please verify your email'
        }, { status: 200 })

    } catch (error) {
        console.error('Error registering User', error)
        return Response.json({
            success: false,
            message: "Error registering user"
        }, { status: 500 })
    }
}