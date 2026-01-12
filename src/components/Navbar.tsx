'use client'
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User } from 'next-auth';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon, LogOut } from 'lucide-react';

const Navbar = () => {
    const { data: session } = useSession();
    const user: User = session?.user as User;

    return (
        <nav className='p-2 md:p-2 shadow-md bg-[#146140] text-white'>
            <div className='container mx-auto flex flex-col md:flex-row justify-between items-center'>
                <a className='text-xl font-bold mb-4 md:mb-0' href="/dashboard" >anonFeedback</a>
                {
                    session ? (
                        <div className="flex items-center gap-4">
                            <span className='hidden md:block mr-2 text-sm font-medium'>
                                {user?.username || user?.email}
                            </span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar className="cursor-pointer">
                                        <AvatarImage src={user?.image} alt={user?.username || "User"} />
                                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                            {user?.username ? user.username[0].toUpperCase() : "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/sign-in' })}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Link href="/sign-in">
                            <Button className='w-full md:w-auto'>Login</Button>
                        </Link>
                    )
                }
            </div>
        </nav>
    )
}

export default Navbar