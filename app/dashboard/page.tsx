"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, BarChart3, MessageSquare, ShoppingCart } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const [partsCount, setPartsCount] = useState(0)
  const [documentsCount, setDocumentsCount] = useState(0)
  const [bomCount, setBomCount] = useState(0)
  const [newRequestsCount, setNewRequestsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  
    // Check if user is logged in
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }
  
    // Fetch counts for Parts, Documents, BOM, and New Requests
    const fetchCounts = async () => {
      try {
        setLoading(true)
  
        // Fetch Parts
        const partsResponse = await fetch("https://skyronerp.onrender.com/api/parts/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
  
        if (!partsResponse.ok) throw new Error("Failed to fetch parts data")
        const partsData = await partsResponse.json()
        //console.log("Parts Data:", partsData) // Log parts data
        const partsCount = Array.isArray(partsData?.parts) ? partsData?.parts.length : 0 // Access the 'parts' array from the response
        //console.log("Parts Count:", partsCount) // Log parts count
  
        // Fetch Documents
        const documentsResponse = await fetch("https://skyronerp.onrender.com/api/documents/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
  
        if (!documentsResponse.ok) throw new Error("Failed to fetch documents data")
        const documentsData = await documentsResponse.json()
        //console.log("Documents Data:", documentsData) // Log documents data
        const documentsCount = Array.isArray(documentsData?.documents) ? documentsData?.documents.length : 0 // Access the 'documents' array from the response
        //console.log("Documents Count:", documentsCount) // Log documents count
  
        // Fetch BOM
        const bomResponse = await fetch("https://skyronerp.onrender.com/api/bom/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
  
        if (!bomResponse.ok) throw new Error("Failed to fetch BOM data")
        const bomData = await bomResponse.json()
        //console.log("BOM Data:", bomData) // Log BOM data
        const bomCount = Array.isArray(bomData?.bomData) ? bomData?.bomData.length : 0 // Access the 'bomData' array from the response
        //console.log("BOM Count:", bomCount) // Log BOM count
  
        // Fetch New Requests
        const newRequestsResponse = await fetch("https://skyronerp.onrender.com/api/requests/allrequests", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
  
        if (!newRequestsResponse.ok) throw new Error("Failed to fetch requests data")
        const newRequestsData = await newRequestsResponse.json()
       // console.log("New Requests Data:", newRequestsData) // Log new requests data
        const newRequestsCount = Array.isArray(newRequestsData) ? newRequestsData.length : 0 // Directly use the array from response
        //console.log("New Requests Count:", newRequestsCount) // Log new requests count
  
        // Set the counts
        setPartsCount(partsCount)
        setDocumentsCount(documentsCount)
        setBomCount(bomCount)
        setNewRequestsCount(newRequestsCount)
  
        setError(null)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  
    fetchCounts()
  }, [router])
  
  
  

  if (!isClient) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">Error loading data: {error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Panel 1 - Parts */}
          <div className="bg-blue-500 text-white rounded-md overflow-hidden shadow">
            <div className="p-4 flex items-center">
              <div className="mr-4">
                <ShoppingCart className="h-12 w-12" />
              </div>
              <div className="flex-1 text-right">
                <div className="text-3xl font-bold">{loading ? "..." : partsCount}</div>
                <div>Parts</div>
              </div>
            </div>
            <Link href="/parts" className="block bg-blue-600 p-2 text-center hover:bg-blue-700 transition-colors">
              <div className="flex justify-between items-center">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>

          {/* Panel 2 - Documents */}
          <div className="bg-green-500 text-white rounded-md overflow-hidden shadow">
            <div className="p-4 flex items-center">
              <div className="mr-4">
                <BarChart3 className="h-12 w-12" />
              </div>
              <div className="flex-1 text-right">
                <div className="text-3xl font-bold">{loading ? "..." : documentsCount}</div>
                <div>Documents</div>
              </div>
            </div>
            <Link href="/documents" className="block bg-green-600 p-2 text-center hover:bg-green-700 transition-colors">
              <div className="flex justify-between items-center">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>

          {/* Panel 3 - BOM */}
          <div className="bg-yellow-500 text-white rounded-md overflow-hidden shadow">
            <div className="p-4 flex items-center">
              <div className="mr-4">
                <ShoppingCart className="h-12 w-12" />
              </div>
              <div className="flex-1 text-right">
                <div className="text-3xl font-bold">{loading ? "..." : bomCount}</div>
                <div>EBOM</div>
              </div>
            </div>
            <Link href="/ebom" className="block bg-yellow-600 p-2 text-center hover:bg-yellow-700 transition-colors">
              <div className="flex justify-between items-center">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>

          {/* Panel 4 - New Requests */}
          <div className="bg-red-500 text-white rounded-md overflow-hidden shadow">
            <div className="p-4 flex items-center">
              <div className="mr-4">
                <MessageSquare className="h-12 w-12" />
              </div>
              <div className="flex-1 text-right">
                <div className="text-3xl font-bold">{loading ? "..." : newRequestsCount}</div>
                <div>New Requests</div>
              </div>
            </div>
            <Link href="/requests" className="block bg-red-600 p-2 text-center hover:bg-red-700 transition-colors">
              <div className="flex justify-between items-center">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

