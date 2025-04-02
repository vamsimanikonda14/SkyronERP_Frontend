"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Eye, AlertCircle, FileText, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

// Interfaces for parts
interface Part {
  _id: string
  title: string
  type: string
  name: string
  revision: string
  description: string
  revisionComment: string
  project: string
  organization: string
  owner: string
  creationDate: string
}

const PartPage = () => {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    const fetchParts = async () => {
      try {
        const response = await fetch("https://skyronerp.onrender.com/api/parts/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch parts")
        }

        const data = await response.json()

        if (Array.isArray(data.parts)) {
          setParts(data.parts)
        } else {
          console.error("Expected an array of parts, but received:", data.parts)
          setError("Invalid data format received from server")
        }
      } catch (err) {
        console.error("Error fetching parts:", err)
        setError("Failed to load parts. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchParts()
  }, [router])

  // Handle row selection
  const selectRow = (id: string) => {
    setSelectedRow(id === selectedRow ? null : id)
  }

  // Handle checkbox change
  const handleCheckboxChange = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const updatedCheckedItems = new Set(checkedItems)

    if (updatedCheckedItems.has(id)) {
      updatedCheckedItems.delete(id)
    } else {
      updatedCheckedItems.add(id)
    }

    setCheckedItems(updatedCheckedItems)
  }

  // Get selected parts
  const getSelectedItems = (): Part[] => {
    if (checkedItems.size === 0) {
      return parts
    }

    return parts.filter((item) => checkedItems.has(item._id))
  }

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(getSelectedItems())
    XLSX.utils.book_append_sheet(wb, ws, "Parts")
    XLSX.writeFile(wb, "parts.xlsx")
  }

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    const data = getSelectedItems().map((item) => [
      item.title,
      item.type,
      item.name,
      item.revision,
      item.description.substring(0, 20) + (item.description.length > 20 ? "..." : ""),
      item.revisionComment.substring(0, 20) + (item.revisionComment.length > 20 ? "..." : ""),
      item.project,
      item.organization,
      item.owner,
      item.creationDate,
    ])

    doc.autoTable({
      head: [
        [
          "Title",
          "Type",
          "Name",
          "Revision",
          "Description",
          "Revision Comment",
          "Project",
          "Organization",
          "Owner",
          "Creation Date",
        ],
      ],
      body: data,
      styles: { fontSize: 8, cellPadding: 1 },
      columnStyles: {
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
      },
    })
    doc.save("parts.pdf")
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Parts Table</h1>
          <div className="flex space-x-2">
            <Button onClick={exportToExcel} variant="outline" size="sm" className="flex items-center">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Export to PDF
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {error && (
              <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 border-l-4 border-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}

            {loading ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-orange-500 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 text-left w-10">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="p-3 text-left font-medium text-white text-sm">Title</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Type</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Name</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Revision</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Description</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Revision Comment</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Project</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Organization</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Owner</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Creation Date</th>
                        <th className="p-3 text-left font-medium text-white text-sm w-10">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="text-center p-8 text-gray-500">
                            No parts found.
                          </td>
                        </tr>
                      ) : (
                        parts.map((item) => {
                          const isSelected = selectedRow === item._id
                          const isChecked = checkedItems.has(item._id)

                          return (
                            <tr
                              key={item._id}
                              className={`border-t border-gray-200 hover:bg-gray-50 transition-colors ${
                                isSelected ? "bg-blue-50" : ""
                              }`}
                              onClick={() => selectRow(item._id)}
                            >
                              <td className="p-3 w-10">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  onClick={(e) => handleCheckboxChange(item._id, e)}
                                />
                              </td>
                              <td className="p-3 text-sm">{item.title}</td>
                              <td className="p-3 text-sm">{item.type}</td>
                              <td className="p-3 text-sm">{item.name}</td>
                              <td className="p-3 text-sm">{item.revision}</td>
                              <td className="p-3 text-sm max-w-[200px] truncate">{item.description}</td>
                              <td className="p-3 text-sm max-w-[200px] truncate">{item.revisionComment}</td>
                              <td className="p-3 text-sm">{item.project}</td>
                              <td className="p-3 text-sm">{item.organization}</td>
                              <td className="p-3 text-sm">{item.owner}</td>
                              <td className="p-3 text-sm">{item.creationDate}</td>
                              <td className="p-3 w-10">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default PartPage

