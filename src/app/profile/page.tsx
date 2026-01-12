'use client';

import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { User } from 'next-auth';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Pencil, Save, Lock, Camera } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/use-debounce'; // Assuming you have this hook
import { ApiResponse } from '@/types/ApiResponse';

// Define the schema for profile updates
const profileSchema = z.object({
    username: z
        .string()
        .min(2, 'Username must be at least 2 characters')
        .max(20, 'Username must be no more than 20 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username must not contain special characters'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameMessage, setUsernameMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);


    const user = session?.user as User;



    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: user?.username || '',
        },
        mode: 'onChange'
    });

    const username = form.watch('username');
    const debouncedUsername = useDebounce(username, 300);

    // Update form default values when session loads
    useEffect(() => {
        if (user?.username) {
            form.setValue('username', user.username);
        }
    }, [user, form]);

    // Check username availability
    useEffect(() => {
        const checkUsernameUnique = async () => {
            if (debouncedUsername && debouncedUsername !== user?.username) {
                setIsCheckingUsername(true);
                setUsernameMessage('');
                try {
                    const response = await axios.get(`/api/check-username-unique?username=${debouncedUsername}`);
                    setUsernameMessage(response.data.message);
                } catch (error) {
                    const axiosError = error as AxiosError<ApiResponse>;
                    setUsernameMessage(
                        axiosError.response?.data.message ?? 'Error checking username'
                    );
                } finally {
                    setIsCheckingUsername(false);
                }
            } else {
                setUsernameMessage('');
            }
        };
        checkUsernameUnique();
    }, [debouncedUsername, user]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (data.username === user?.username) {
            return;
        }

        setIsSaving(true);
        try {
            const response = await axios.post<ApiResponse>('/api/update-profile', {
                username: data.username,
            });

            toast.success('Profile updated', {
                description: "Your username has been updated successfully."
            });

            // Update the session with the new username
            await update({
                ...session,
                user: {
                    ...session?.user,
                    username: data.username
                }
            });
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error('Error', {
                description: axiosError.response?.data.message || 'Failed to update profile'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!session) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-center">My Profile</CardTitle>
                    <CardDescription className="text-center">
                        Manage your account settings and set your public display name.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Public Profile Section */}
                    <div className="flex items-center space-x-4 justify-center">
                        <div className="relative group">
                            <Avatar className="flex items-center justify-center h-20 w-20">
                                <AvatarImage src={user?.image} alt={user?.username || 'User'} />
                                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                                    {user?.username ? user.username[0].toUpperCase() : 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium leading-none">{user?.username || 'User'}</h3>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>

                        </div>
                    </div>

                    {/* Username Update Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xl font-semibold">Username</FormLabel>
                                        <CardDescription>
                                            This is your URL namespace within AnonFeedback.
                                        </CardDescription>


                                        <div className="relative flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all overflow-hidden mt-2">
                                            <div className="bg-muted px-3 py-2 border-r text-muted-foreground text-base cursor-default select-none h-10 flex items-center">
                                                anonfeedback.com/
                                            </div>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 h-10 text-base bg-transparent flex-1"
                                                    placeholder="username"
                                                    disabled={isSaving}
                                                />
                                            </FormControl>
                                            {isSaving && (
                                                <div className="absolute right-4 text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Message */}
                                        <div className="h-5 mt-1">
                                            {isCheckingUsername && <p className="text-sm text-muted-foreground">Checking availability...</p>}
                                            {usernameMessage && !isCheckingUsername && (
                                                <p className={`text-sm ${usernameMessage === 'Username is unique' || usernameMessage === 'Username is available' ? 'text-blue-600' : 'text-red-500'}`}>
                                                    {usernameMessage}
                                                </p>
                                            )}
                                            <FormMessage />
                                        </div>

                                        <div className="flex justify-between items-center mt-4 border-t pt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Please keep username so that people know you easily
                                            </p>
                                            <Button
                                                type="submit"
                                                className="bg-black hover:bg-neutral-800 text-white font-medium"
                                                disabled={isSaving || username === user?.username || isCheckingUsername}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-2xl">Security</CardTitle>
                    <CardDescription>
                        Manage your password and security settings.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PasswordForm />
                </CardContent>
            </Card>
        </div>
    );
}

const passwordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

function PasswordForm() {
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
        setIsSaving(true);
        try {
            await axios.post<ApiResponse>('/api/update-profile', {
                password: data.password,
            });

            toast.success('Password updated', {
                description: "Your password has been changed successfully."
            });

            form.reset();
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error('Error', {
                description: axiosError.response?.data.message || 'Failed to update password'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="* * * * *"
                                    {...field}
                                    className="px-3 py-2 h-10 text-base"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="* * * * *"
                                    {...field}
                                    className="px-3 py-2 h-10 text-base"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-between items-center mt-4 border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        Please use a strong password
                    </p>
                    <Button
                        type="submit"
                        className="bg-black hover:bg-neutral-800 text-white font-medium"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Save"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
