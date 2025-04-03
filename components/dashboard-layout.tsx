"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, Cog, FileText, Home, LogOut, Search, Table, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [username, setUsername] = useState("")
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUsername(user.fullname || user.email || "User")
      } catch (err) {
        console.error("Error parsing user data:", err)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b px-4 py-2 flex justify-between items-center fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center">
          <Link href="/dashboard" className="text-xl font-bold">
            Skyron-ERP
          </Link>
        </div>

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>{username}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Sidebar */}
      <div className="fixed top-[53px] left-0 bottom-0 w-[250px] bg-white border-r overflow-y-auto">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8" />
          </div>
        </div>

        <nav className="p-2">
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#f79c34] hover:text-white transition-colors ${
                  pathname === "/dashboard" ? "bg-[#f79c34] text-white" : ""
                }`}
              >
                <Home className="h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/documents"
                className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#f79c34] hover:text-white transition-colors ${
                  pathname === "/documents" ? "bg-[#f79c34] text-white" : ""
                }`}
              >
                <FileText className="h-5 w-5" />
                Documents
              </Link>
            </li>
            <li>
              <Link
                href="/ebom"
                className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#f79c34] hover:text-white transition-colors ${
                  pathname === "/ebom" ? "bg-[#f79c34] text-white" : ""
                }`}
              >
                <Table className="h-5 w-5" />
                EBOM
              </Link>
            </li>
            <li>
              <Link
                href="/parts"
                className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#f79c34] hover:text-white transition-colors ${
                  pathname === "/parts" ? "bg-[#f79c34] text-white" : ""
                }`}
              >
                <Table className="h-5 w-5" />
                Parts
              </Link>
            </li>
            
            <li>
              <Link
                href="/apis"
                className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#f79c34] hover:text-white transition-colors ${
                  pathname === "/apis" ? "bg-[#f79c34] text-white" : ""
                }`}
              >
                <Cog className="h-5 w-5" />
                API's
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <main className="ml-[250px] mt-[53px] flex-1">{children}</main>
    </div>
  )
}

