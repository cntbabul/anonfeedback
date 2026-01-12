'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usernameValidation } from '@/schemas/signUpSchema';
import { ApiResponse } from '@/types/ApiResponse';

const OnboardingSchema = z.object({
    username: usernameValidation,
});

export default function OnboardingPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [usernameMessage, setUsernameMessage] = useState('');
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const debouncedUsername = useDebounce(username, 300);

    const form = useForm<z.infer<typeof OnboardingSchema>>({
        resolver: zodResolver(OnboardingSchema),
        defaultValues: {
            username: '',
        },
    });

    useEffect(() => {
        const checkUsernameAvailability = async () => {
            if (debouncedUsername) {
                setIsCheckingUsername(true);
                setUsernameMessage(''); // Reset message
                try {
                    const response = await axios.get(
                        `/api/check-username-unique?username=${debouncedUsername}`
                    );
                    setUsernameMessage(response.data.message);
                } catch (error) {
                    const axiosError = error as AxiosError<ApiResponse>;
                    setUsernameMessage(
                        axiosError.response?.data.message ?? 'Error checking username'
                    );
                } finally {
                    setIsCheckingUsername(false);
                }
            }
        };
        checkUsernameAvailability();
    }, [debouncedUsername]);

    const onSubmit = async (data: z.infer<typeof OnboardingSchema>) => {
        setIsSubmitting(true);
        try {
            const response = await axios.post<ApiResponse>('/api/complete-profile', data);

            toast.success('Welcome!', {
                description: "Your profile has been set up successfully."
            });

            // Update session to reflect changes (isUsernameSet/isOnboarded)
            await update({ isOnboarded: true, username: data.username });

            router.replace('/profile');
        } catch (error) {
            console.error('Error during onboarding:', error);
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error('Error', {
                description: axiosError.response?.data.message ?? "Failed to update profile"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-800">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
                        Welcome to True Feedback
                    </h1>
                    <p className="mb-4">Create your unique username to get started</p>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            name="username"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="username"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                setUsername(e.target.value);
                                            }}
                                        />
                                    </FormControl>
                                    {isCheckingUsername && <Loader2 className="animate-spin" />}
                                    {!isCheckingUsername && usernameMessage && (
                                        <p
                                            className={`text-sm ${usernameMessage === 'Username is available'
                                                ? 'text-green-500'
                                                : 'text-red-500'
                                                }`}
                                        >
                                            {usernameMessage}
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Please wait
                                </>
                            ) : (
                                'Start Your Adventure'
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
