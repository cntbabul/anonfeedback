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
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameMessage, setUsernameMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const user = session?.user as User;

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit
                toast.error("File too large", { description: "Please upload an image smaller than 1MB" });
                return;
            }

            setIsUploadingImage(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                try {
                    await axios.post<ApiResponse>('/api/update-profile', {
                        image: base64String,
                    });
                    await update({
                        ...session,
                        user: {
                            ...session?.user,
                            image: base64String
                        }
                    });
                    toast.success('Profile picture updated');
                } catch (error) {
                    console.error("Error uploading image:", error);
                    toast.error("Failed to upload image");
                } finally {
                    setIsUploadingImage(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

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
            setIsEditingUsername(false);
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

            setIsEditingUsername(false);
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
                    <CardTitle className="text-2xl">My Profile</CardTitle>
                    <CardDescription>
                        Manage your account settings and set your public display name.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Public Profile Section */}
                    <div className="flex items-center space-x-4">
                        <div className="relative group">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user?.image} alt={user?.username || 'User'} />
                                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                                    {user?.username ? user.username[0].toUpperCase() : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <div
                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isUploadingImage ? (
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-6 w-6 text-white" />
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium leading-none">{user?.username || 'User'}</h3>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                            <p className="text-xs text-muted-foreground cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
                                Change Profile Photo
                            </p>
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
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Username</FormLabel>
                                            {!isEditingUsername && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setIsEditingUsername(true);
                                                        // focus logic could go here
                                                    }}
                                                    className="h-8 px-2"
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={!isEditingUsername}
                                                    className={!isEditingUsername ? "bg-muted" : ""}
                                                />
                                            </FormControl>

                                            {isEditingUsername && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="submit"
                                                        disabled={
                                                            isSaving ||
                                                            isCheckingUsername ||
                                                            usernameMessage === 'Username is taken'
                                                        }
                                                    >
                                                        {isSaving ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            form.reset({ username: user?.username });
                                                            setIsEditingUsername(false);
                                                            setUsernameMessage('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Availability Message */}
                                        {isEditingUsername && (
                                            <div className="h-4">
                                                {isCheckingUsername && <p className="text-sm text-muted-foreground">Checking availability...</p>}
                                                {!isCheckingUsername && usernameMessage && (
                                                    <p className={`text-sm ${usernameMessage === 'Username is unique' ? 'text-green-500' : 'text-red-500'
                                                        }`}>
                                                        {usernameMessage}
                                                    </p>
                                                )}
                                                <FormMessage />
                                            </div>
                                        )}
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
    const [isEditing, setIsEditing] = useState(false);
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

            setIsEditing(false);
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
                <div className="flex items-center justify-between mb-4">
                    <div className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Lock className="h-4 w-4 text-primary" />
                        </div>
                        Change Password
                    </div>
                    {!isEditing && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    )}
                </div>

                {isEditing && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter new password" {...field} />
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
                                        <Input type="password" placeholder="Confirm new password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-2 justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setIsEditing(false);
                                    form.reset();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Password
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </Form>
    );
}
