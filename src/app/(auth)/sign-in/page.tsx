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
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

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
                        Welcome Back to AnonFeedback
                    </h1>
                    <p className="mb-4 text-gray-700">Sign in to get secret Feedback</p>
                </div>

                <div className="flex flex-col gap-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="identifier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email/Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your email or username" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Enter your password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                className='w-full'
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>
                    </Form>

                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">Or sign in with</span>
                        </div>
                    </div>

                    <Button variant="outline" onClick={() => signIn('google')} type="button" className="w-full flex items-center justify-center gap-2 h-11 text-base">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign in with Google
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" onClick={() => signIn('github')} type="button" className="w-full">
                            GitHub
                        </Button>
                        <Button variant="outline" onClick={() => signIn('apple')} type="button" className="w-full">
                            Apple
                        </Button>
                        <Button variant="outline" onClick={() => signIn('azure-ad')} type="button" className="w-full">
                            Microsoft
                        </Button>
                        <Button variant="outline" onClick={() => signIn('facebook')} type="button" className="w-full">
                            Facebook
                        </Button>
                    </div>
                </div>

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