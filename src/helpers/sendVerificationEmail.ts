import { resend } from "../lib/resend";
import VerificationEmail from "@/emails/VerificationEmail";
import { ApiResponse } from "../types/ApiResponse";


export async function sendVerificationEmail(
    email: string,
    username: string,
    verifyCode: string
): Promise<ApiResponse> {
    try {
        const { data, error } = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Verify your email address || anonfeedback",
            react: VerificationEmail({ username, otp: verifyCode })
        })

        if (error) {
            console.error("Error sending verification email:", error)
            return { success: false, message: error.message }
        }

        return { success: true, message: "Verification Email Sent successfully" }
    } catch (emailError: any) {
        console.error("Error sending verification email:", emailError)
        return { success: false, message: emailError.message || "Failed to send Verification Email" }
    }
}