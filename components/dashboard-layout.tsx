"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  ChevronDown,
  Settings,
  FileText,
  Home,
  LogOut,
  Search,
  Database,
  Package,
  ClipboardList,
  User,
} from "lucide-react"
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
  const [newRequestsCount, setNewRequestsCount] = useState(0)
  const [notificationsVisible, setNotificationsVisible] = useState(false)
  const [newRequests, setNewRequests] = useState<any[]>([]) // Use appropriate type for requests

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

    // Fetch new requests count and details from API
    fetchNewRequests()
  }, [])

  const fetchNewRequests = async () => {
    try {
      // Get the auth token from localStorage
      const authToken = localStorage.getItem("authToken");
  
      if (!authToken) {
        console.error("Authentication token not found");
        return;
      }
  
      // Debugging: log token and headers
      console.log('Auth Token:', authToken);
  
      const response = await fetch("https://skyronerp.onrender.com/api/requests/allrequests", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        if (response.status === 403) {
          console.error("Authorization error: You may need to log in again.");
          // Optional: Handle re-login or redirect to login
          return;
        }
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      setNewRequests(data);
      setNewRequestsCount(data.length); // Assuming data is an array of requests
    } catch (error) {
      console.error("Error fetching new requests:", error);
      // Handle the error gracefully
      setNewRequests([]);
      setNewRequestsCount(0);
    }
  };
  

  const toggleNotifications = () => {
    setNotificationsVisible((prev) => !prev)
  }

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

        {/* User Profile and Notification */}
        <div className="flex items-center gap-3">
          {/* Notification Icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative" onClick={toggleNotifications}>
                <Bell className="h-5 w-5" />
                {/* Notification Badge */}
                {newRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {newRequestsCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 mt-2 bg-white shadow-lg rounded-md p-2 text-black">
              {newRequests.length > 0 ? (
                newRequests.map((request, index) => (
                  <DropdownMenuItem key={index} className="text-sm p-2 text-black">
  {request.title}
</DropdownMenuItem>

                ))
              ) : (
                <DropdownMenuItem className="text-sm p-2 text-black">No new requests</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
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
                <Database className="h-5 w-5" />
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
                <Package className="h-5 w-5" />
                Parts
              </Link>
            </li>
            <li>
              <Link
                href="/requests"
                className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#f79c34] hover:text-white transition-colors ${
                  pathname === "/requests" ? "bg-[#f79c34] text-white" : ""
                }`}
              >
                <ClipboardList className="h-5 w-5" />
                New requests
              </Link>
            </li>
            <li>
              <Link
                href="/apis"
                className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#f79c34] hover:text-white transition-colors ${
                  pathname === "/apis" ? "bg-[#f79c34] text-white" : ""
                }`}
              >
                <Settings className="h-5 w-5" />
                API's
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <main className="ml-[250px] mt-[53px] flex-1 p-6">{children}</main>
    </div>
  )
}

