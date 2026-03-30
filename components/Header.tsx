import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import NavItems from './NavItems'
import UserDropdown from './UserDropdown'
import { searchStocks } from '@/lib/actions/finnhub.actions'
import { TrendingUp } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { getUnreadNotifications } from '@/lib/actions/notification.actions'

const Header =async ({user}:{user:User}) => {
    const initialStocks=await searchStocks();
    const notifications = user?.id ? await getUnreadNotifications(user.id) : [];
  return (
    <header className='sticky top-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/5'>
        <div className='container flex justify-between items-center px-6 py-4'>
            <Link href="/" className="flex items-center gap-3 group">
                <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <span className="text-white font-bold text-xl tracking-tight">TikkiTrades</span>
            </Link>
            <nav className='hidden sm:block '>
                <NavItems initialStocks={initialStocks}/>
            </nav>
            <div className="flex items-center gap-2">
                {user && <NotificationBell userId={user.id} initialNotifications={notifications} />}
                <UserDropdown user={user} initialStocks={initialStocks}/>
            </div>
        </div>
    </header>
  )
}

export default Header