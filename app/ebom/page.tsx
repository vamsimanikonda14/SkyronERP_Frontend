"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Minus, Plus, Eye, AlertCircle, FileText, FileSpreadsheet, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

// Interfaces for BOM items and their nested structures
interface BomItem {
  _id: string
  parent_part: string
  title: string
  position_matrix: string
  revision: string
  type: string
  description: string
  owner: string
  name: string
  lock: boolean
  is_revision: boolean
  maturity_state: string
  ca: string
  enterprise_item: string
  children?: BomItem[]
  level?: number
}

const EbomPage = () => {
  const [bomData, setBomData] = useState<BomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("authToken")

    if (!token) {
      router.push("/")
      return
    }

    const fetchBomData = async () => {
      try {
        // Add a small delay to ensure token is properly retrieved
        await new Promise((resolve) => setTimeout(resolve, 100))

        const response = await fetch("https://skyronerp.onrender.com/api/bom/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        if (response.status === 403) {
          throw new Error("Authentication failed. Please log in again.")
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch EBOM data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (Array.isArray(data.bomData)) {
          // Process the data to ensure proper hierarchy
          const processedData = processHierarchicalData(data.bomData)
          setBomData(processedData)
        } else {
          console.error("Expected an array of BOM data, but received:", data)
          setError("Invalid data format received from server")
        }
      } catch (err) {
        console.error("Error fetching EBOM data:", err)
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Failed to load EBOM data. Please try again later.")
        }

        // If authentication error, redirect to login
        if (err instanceof Error && err.message.includes("Authentication failed")) {
          localStorage.removeItem("authToken")
          router.push("/")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBomData()
  }, [router])

  // Process data to ensure proper hierarchy
  const processHierarchicalData = (data: BomItem[]): BomItem[] => {
    // Create a map for quick lookup
    const itemMap = new Map<string, BomItem>()

    // First pass: add all items to the map
    data.forEach((item) => {
      // Ensure children array exists
      if (!item.children) {
        item.children = []
      }
      itemMap.set(item._id, item)
    })

    // Second pass: build the hierarchy
    const rootItems: BomItem[] = []

    data.forEach((item) => {
      if (!item.parent_part || item.parent_part === "root" || !itemMap.has(item.parent_part)) {
        // This is a root item
        rootItems.push(item)
      } else {
        // This is a child item
        const parent = itemMap.get(item.parent_part)
        if (parent && parent.children) {
          parent.children.push(item)
        }
      }
    })

    return rootItems
  }

  const toggleRow = (id: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row selection when toggling
    const updatedExpandedRows = new Set(expandedRows)
    if (updatedExpandedRows.has(id)) {
      updatedExpandedRows.delete(id)
    } else {
      updatedExpandedRows.add(id)
    }
    setExpandedRows(updatedExpandedRows)
  }

  const selectRow = (id: string) => {
    setSelectedRow(id === selectedRow ? null : id)
  }

  // Recursive function to render BOM items with proper hierarchy
  const renderBomItem = (item: BomItem, level = 0, parentPath = "") => {
    const isExpanded = expandedRows.has(item._id)
    const isSelected = selectedRow === item._id
    const hasChildren = item.children && item.children.length > 0

    // Create a unique path for this item that includes its ancestry
    const currentPath = parentPath ? `${parentPath}-${item._id}` : item._id

    // Create rows array to hold this item and its children
    const rows = []

    // Add the current item row
    rows.push(
      <tr
        key={currentPath}
        className={`border-t border-gray-200 hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}
        onClick={() => selectRow(item._id)}
      >
        <td className="p-3 w-10">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        </td>
        <td className="p-3">
          <div className="flex items-center">
            <div style={{ width: `${level * 20}px` }} className="flex-shrink-0"></div>
            {hasChildren ? (
              <button
                onClick={(e) => toggleRow(item._id, e)}
                className="mr-2 focus:outline-none text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            ) : (
              <div className="w-6 mr-2"></div>
            )}
            <span className="font-medium">{item.title}</span>
          </div>
        </td>
        <td className="p-3">{item.position_matrix}</td>
        <td className="p-3">{item.revision}</td>
        <td className="p-3">{item.type}</td>
        <td className="p-3">{item.description}</td>
        <td className="p-3">{item.owner}</td>
        <td className="p-3">{item.name}</td>
        <td className="p-3">{item.lock ? "Yes" : "No"}</td>
        <td className="p-3">{item.is_revision ? "Yes" : "No"}</td>
        <td className="p-3">{item.maturity_state}</td>
        <td className="p-3">{item.ca}</td>
        <td className="p-3">{item.enterprise_item}</td>
        <td className="p-3 w-10">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-4 w-4 text-gray-500" />
          </Button>
        </td>
      </tr>,
    )

    // Add children rows if expanded
    if (isExpanded && hasChildren && item.children) {
      item.children.forEach((child, index) => {
        // Recursively render child items with updated path
        const childRows = renderBomItem(child, level + 1, currentPath)
        rows.push(...childRows)
      })
    }

    return rows
  }

  const renderTableSkeleton = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <tr key={`skeleton-${index}`} className="border-t border-gray-200">
          <td className="p-3 w-10">
            <Skeleton className="h-4 w-4" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-40" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-20" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-16" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-16" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-32" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-24" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-24" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-12" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-12" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-24" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-12" />
          </td>
          <td className="p-3">
            <Skeleton className="h-5 w-24" />
          </td>
          <td className="p-3 w-10">
            <Skeleton className="h-8 w-8 rounded-md" />
          </td>
        </tr>
      ))
  }

  // Function to flatten hierarchical data for export
  const flattenBomData = (data: BomItem[], level = 0, result: BomItem[] = []): BomItem[] => {
    data.forEach((item) => {
      // Add level property for indentation in exports
      const flatItem = { ...item, level }
      result.push(flatItem)

      if (item.children && item.children.length > 0) {
        flattenBomData(item.children, level + 1, result)
      }
    })

    return result
  }

  // Export to Excel function
  const exportToExcel = () => {
    // Flatten the hierarchical data
    const flatData = flattenBomData(bomData)

    // Prepare data for Excel
    const excelData = flatData.map((item) => ({
      Title: "  ".repeat(item.level) + item.title,
      "Position Matrix": item.position_matrix,
      Revision: item.revision,
      Type: item.type,
      Description: item.description,
      Owner: item.owner,
      Name: item.name,
      Lock: item.lock ? "Yes" : "No",
      "Is Revision": item.is_revision ? "Yes" : "No",
      "Maturity State": item.maturity_state,
      CA: item.ca,
      "Enterprise Item": item.enterprise_item,
    }))

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "EBOM")

    // Generate Excel file
    XLSX.writeFile(workbook, "EBOM_Export.xlsx")
  }

  // Export to PDF function
  const exportToPDF = () => {
    // Create new PDF document
    const doc = new jsPDF("l", "mm", "a3")

    // Flatten the hierarchical data
    const flatData = flattenBomData(bomData)

    // Prepare data for PDF
    const tableData = flatData.map((item) => [
      "  ".repeat(item.level) + item.title,
      item.position_matrix,
      item.revision,
      item.type,
      item.description,
      item.owner,
      item.name,
      item.lock ? "Yes" : "No",
      item.is_revision ? "Yes" : "No",
      item.maturity_state,
      item.ca,
      item.enterprise_item,
    ])

    // Add title
    doc.setFontSize(18)
    doc.text("EBOM Export", 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

    // Add table
    doc.autoTable({
      head: [
        [
          "Title",
          "Position Matrix",
          "Revision",
          "Type",
          "Description",
          "Owner",
          "Name",
          "Lock",
          "Is Revision",
          "Maturity State",
          "CA",
          "Enterprise Item",
        ],
      ],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [247, 156, 52] },
    })

    // Save PDF
    doc.save("EBOM_Export.pdf")
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">EBOM Table</h2>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Export <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm">Add Item</Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f79c34] text-white">
                  <th className="p-3 text-left w-10"></th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Position Matrix</th>
                  <th className="p-3 text-left">Revision</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Owner</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Lock</th>
                  <th className="p-3 text-left">Is Revision</th>
                  <th className="p-3 text-left">Maturity State</th>
                  <th className="p-3 text-left">CA</th>
                  <th className="p-3 text-left">Enterprise Item</th>
                  <th className="p-3 text-left w-10">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderTableSkeleton()
                ) : bomData.length > 0 ? (
                  bomData.flatMap((item) => renderBomItem(item))
                ) : (
                  <tr>
                    <td colSpan={14} className="p-8 text-center text-gray-500">
                      No EBOM data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default EbomPage

