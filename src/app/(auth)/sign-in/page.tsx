'use client'
import { useSession, signIn, signOut } from "next-auth/react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signInSchema } from "@/schemas/signInSchema"
import { useState } from "react"

export default function Component() {
    const { data: session } = useSession()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Define the form || zod implementation
    const form = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            identifier: "",
            password: "",
        },
    })

    const onSubmit = async (data: z.infer<typeof signInSchema>) => {
        setIsSubmitting(true)
        const result = await signIn('credentials', {
            redirect: false,
            identifier: data.identifier,
            password: data.password
        })
        setIsSubmitting(false)

        if (result?.error) {
            toast.error('Login Failed', {
                description: result.error,
            });
        } else {
            if (result?.url) {
                router.replace('/dashboard')
            }
        }
    }

    if (session) {
        return (
            <>
                Signed in as {session.user.email}<br />
                <button onClick={() => signOut()} className="bg-red-500 text-white p-2 rounded">Sign out</button>
            </>
        )
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-800">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6 text-gray-900">
                        Welcome Back to Anonymous Feedback
                    </h1>
                    <p className="mb-4 text-gray-700">Sign in to continue your secret conversations</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Email/Username</label>
                        <input
                            {...form.register("identifier")}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900"
                        />
                        {form.formState.errors.identifier && (
                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.identifier.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Password</label>
                        <input
                            type="password"
                            {...form.register("password")}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900"
                        />
                        {form.formState.errors.password && (
                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    <button
                        className='w-full py-2 px-4 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50'
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-gray-700">
                        Not a member yet?{' '}
                        <Link href="/sign-up" className="text-blue-600 hover:text-blue-800">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}