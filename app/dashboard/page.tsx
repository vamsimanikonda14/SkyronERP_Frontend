"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, BarChart3, ChevronDown, MessageSquare, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DashboardLayout from "@/components/dashboard-layout"

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)

    // Check if user is logged in
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
    }

    // Initialize Morris.js charts if available
    if (typeof window !== "undefined" && window.Morris) {
      window.Morris.Area({
        element: "morris-area-chart",
        data: [
          { period: "2010 Q1", iphone: 2666, ipad: null, itouch: 2647 },
          { period: "2010 Q2", iphone: 2778, ipad: 2294, itouch: 2441 },
          { period: "2010 Q3", iphone: 4912, ipad: 1969, itouch: 2501 },
          { period: "2010 Q4", iphone: 3767, ipad: 3597, itouch: 5689 },
          { period: "2011 Q1", iphone: 6810, ipad: 1914, itouch: 2293 },
          { period: "2011 Q2", iphone: 5670, ipad: 4293, itouch: 1881 },
          { period: "2011 Q3", iphone: 4820, ipad: 3795, itouch: 1588 },
          { period: "2011 Q4", iphone: 15073, ipad: 5967, itouch: 5175 },
          { period: "2012 Q1", iphone: 10687, ipad: 4460, itouch: 2028 },
          { period: "2012 Q2", iphone: 8432, ipad: 5713, itouch: 1791 },
        ],
        xkey: "period",
        ykeys: ["iphone", "ipad", "itouch"],
        labels: ["iPhone", "iPad", "iPod Touch"],
        pointSize: 2,
        hideHover: "auto",
        resize: true,
      })
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!isClient) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Panel 1 - Comments */}
          <div className="bg-blue-500 text-white rounded-md overflow-hidden shadow">
            <div className="p-4 flex items-center">
              <div className="mr-4">
                <MessageSquare className="h-12 w-12" />
              </div>
              <div className="flex-1 text-right">
                <div className="text-3xl font-bold">26</div>
                <div>New Comments!</div>
              </div>
            </div>
            <Link href="#" className="block bg-blue-600 p-2 text-center hover:bg-blue-700 transition-colors">
              <div className="flex justify-between items-center">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>

          {/* Panel 2 - Tasks */}
          <div className="bg-green-500 text-white rounded-md overflow-hidden shadow">
            <div className="p-4 flex items-center">
              <div className="mr-4">
                <BarChart3 className="h-12 w-12" />
              </div>
              <div className="flex-1 text-right">
                <div className="text-3xl font-bold">12</div>
                <div>New Tasks!</div>
              </div>
            </div>
            <Link href="#" className="block bg-green-600 p-2 text-center hover:bg-green-700 transition-colors">
              <div className="flex justify-between items-center">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>

          {/* Panel 3 - Orders */}
          <div className="bg-yellow-500 text-white rounded-md overflow-hidden shadow">
            <div className="p-4 flex items-center">
              <div className="mr-4">
                <ShoppingCart className="h-12 w-12" />
              </div>
              <div className="flex-1 text-right">
                <div className="text-3xl font-bold">124</div>
                <div>New Orders!</div>
              </div>
            </div>
            <Link href="#" className="block bg-yellow-600 p-2 text-center hover:bg-yellow-700 transition-colors">
              <div className="flex justify-between items-center">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>

          {/* Panel 4 - Support Tickets */}
          <div className="bg-red-500 text-white rounded-md overflow-hidden shadow">
            <div className="p-4 flex items-center">
              <div className="mr-4">
                <MessageSquare className="h-12 w-12" />
              </div>
              <div className="flex-1 text-right">
                <div className="text-3xl font-bold">13</div>
                <div>Support Tickets!</div>
              </div>
            </div>
            <Link href="#" className="block bg-red-600 p-2 text-center hover:bg-red-700 transition-colors">
              <div className="flex justify-between items-center">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>

        {/* Area Chart */}
        <div className="mt-8">
          <div className="bg-white rounded-md shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                <span>Area Chart Example</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Action</DropdownMenuItem>
                  <DropdownMenuItem>Another action</DropdownMenuItem>
                  <DropdownMenuItem>Something else here</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Separated link</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="p-4">
              <div id="morris-area-chart" style={{ height: "300px" }}></div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

