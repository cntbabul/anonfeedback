'use client'
import React from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { verifySchema } from '@/schemas/verifySchema'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios, { AxiosError } from 'axios'
import { ApiResponse } from '@/types/ApiResponse'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const VerifyAccount = () => {
    const router = useRouter()
    const param = useParams<{ username: string }>()
    const searchParams = useSearchParams()
    const email = searchParams.get('email')

    const form = useForm<z.infer<typeof verifySchema>>({
        resolver: zodResolver(verifySchema)
    })

    const onSubmit = async (data: z.infer<typeof verifySchema>) => {
        try {

            const response = await axios.post("/api/verify-code", { username: param.username, code: data.code })

            toast.success('Success', {
                description: response.data.message,
            })
            router.replace(`/sign-in`)
        } catch (error) {
            console.error("Error verifying user otp", error)
            const axiosError = error as AxiosError<ApiResponse>;

            toast.error("Verification Failed", {
                description: axiosError.response?.data.message ?? "An error occurred"
            })
        }
    }

    const [timeLeft, setTimeLeft] = React.useState(50);
    const [canResend, setCanResend] = React.useState(false);

    React.useEffect(() => {
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        } else {
            setCanResend(true);
        }
    }, [timeLeft]);

    const handleResendCode = async () => {
        try {
            const response = await axios.post("/api/resend-code", { username: param.username });
            toast.success('Code Sent', {
                description: response.data.message,
            });
            setTimeLeft(50);
            setCanResend(false);
        } catch (error: any) {
            console.error("Error resending code", error);
            const errorMessage = error.response?.data?.message || "Failed to resend code";
            toast.error("Error", {
                description: errorMessage
            });
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
                        Verify Your Account
                    </h1>
                    <p className="mb-4">Enter the verification code sent to your email {email}</p>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            name="code"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Verification Code</FormLabel>
                                    <Input {...field} />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex flex-col gap-4">
                            <Button type="submit">Verify</Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResendCode}
                                disabled={!canResend}
                            >
                                {canResend ? "Resend Code" : `Resend Code in ${timeLeft}s`}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}

export default VerifyAccount;