'use client'
import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import Link from "next/link"
import { NAV_ITEMS } from "@/lib/constants"
import { usePathname } from "next/navigation"
import SearchCommand from "@/components/SearchCommand"

export function MobileNav({initialStocks}: { initialStocks: any[]}) {
  const pathName = usePathname();

  const isActive = (path: string) => {
      if (path === '/') return pathName === '/'
      return pathName.startsWith(path)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden text-foreground">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {NAV_ITEMS.map(({href, label}) => {
          if(href === '/search') return (
            <DropdownMenuItem key="search-trigger" asChild>
              <div className="w-full cursor-pointer">
                <SearchCommand
                    renderAs="text"
                    label="Search"
                    initialStocks={initialStocks}
                />
              </div>
            </DropdownMenuItem>
          )

          return (
            <DropdownMenuItem key={href} asChild>
              <Link 
                href={href} 
                className={`w-full cursor-pointer ${isActive(href) ? 'text-emerald-500 font-medium' : 'text-foreground'}`}
              >
                {label}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
