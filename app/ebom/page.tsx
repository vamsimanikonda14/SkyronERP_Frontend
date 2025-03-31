"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"

interface BomItem {
  type: string
  name: string
  revision: string
  partNumber: string
  description: string
  quantityRequired: number
  stockLevel: number
  supplierInfo: string
  partWeight: string
  uom: string
  manufacturingInfo: string
  inventoryLocation: string
}

export default function EbomPage() {
  const [bomData, setBomData] = useState<BomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [sortedData, setSortedData] = useState<BomItem[]>([])
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    // Fetch EBOM data
    const fetchBomData = async () => {
      try {
        const response = await fetch("https://skyronerp.onrender.com/api/bom/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch EBOM data")
        }

        const data = await response.json()

        if (Array.isArray(data.bomData)) {
          setBomData(data.bomData)
          setSortedData(data.bomData)  // Initialize with fetched data
        } else {
          console.error("Expected an array of BOM data, but received:", data.bomData)
          setError("Invalid data format received from server")
        }
      } catch (err) {
        console.error("Error fetching EBOM data:", err)
        setError("Failed to load EBOM data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchBomData()
  }, [router])

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem)

  // Handle page change
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Handle sorting
  const handleSort = () => {
    const sorted = [...bomData].sort((a, b) => {
      const dateA = new Date(a.revision) // Assuming revision or another field is date-like
      const dateB = new Date(b.revision)
      return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    })
    setSortedData(sorted)
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">EBOM Table</h2>

        {loading ? (
          <div className="text-center py-8">Loading EBOM data...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Type</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Name</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Revision
                    <button onClick={handleSort} className="ml-2">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </button>
                  </th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Part Number</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Description</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Quantity Required</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Stock Level</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Supplier Info</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Part Weight</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">UOM</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Manufacturing Info</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Inventory Location</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-4">
                      No EBOM data found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="border-b p-3">{item.type}</td>
                      <td className="border-b p-3">{item.name}</td>
                      <td className="border-b p-3">{item.revision}</td>
                      <td className="border-b p-3">{item.partNumber}</td>
                      <td className="border-b p-3">{item.description}</td>
                      <td className="border-b p-3">{item.quantityRequired}</td>
                      <td className="border-b p-3">{item.stockLevel}</td>
                      <td className="border-b p-3">{item.supplierInfo}</td>
                      <td className="border-b p-3">{item.partWeight}</td>
                      <td className="border-b p-3">{item.uom}</td>
                      <td className="border-b p-3">{item.manufacturingInfo}</td>
                      <td className="border-b p-3">{item.inventoryLocation}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Pagination controls */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-gray-300 rounded-l-md"
              >
                Prev
              </button>
              <span className="p-2">{currentPage}</span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage * itemsPerPage >= bomData.length}
                className="p-2 bg-gray-300 rounded-r-md"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
