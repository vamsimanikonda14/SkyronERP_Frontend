"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Eye, AlertCircle, FileText, FileSpreadsheet, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

// Interface for documents
interface Document {
  _id: string
  name: string
  description: string
  fileUrl: string
  createdAt?: string
  updatedAt?: string
}

const DocumentPage = () => {
  const [documents, setDocuments] = useState<Document[]>([])
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

    const fetchDocuments = async () => {
      try {
        const response = await fetch("https://skyronerp.onrender.com/api/documents/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch documents")
        }

        const data = await response.json()

        if (Array.isArray(data.documents)) {
          setDocuments(data.documents)
        } else {
          console.error("Expected an array of documents, but received:", data.documents)
          setError("Invalid data format received from server")
        }
      } catch (err) {
        console.error("Error fetching documents:", err)
        setError("Failed to load documents. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
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

  // Get selected documents
  const getSelectedItems = (): Document[] => {
    if (checkedItems.size === 0) {
      return documents
    }

    return documents.filter((item) => checkedItems.has(item._id))
  }

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(getSelectedItems())
    XLSX.utils.book_append_sheet(wb, ws, "Documents")
    XLSX.writeFile(wb, "documents.xlsx")
  }

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    const data = getSelectedItems().map((item) => [
      item.name,
      item.description.substring(0, 50) + (item.description.length > 50 ? "..." : ""),
      item.fileUrl,
      item.createdAt || "N/A",
      item.updatedAt || "N/A",
    ])

    doc.autoTable({
      head: [["Name", "Description", "File URL", "Created At", "Updated At"]],
      body: data,
      styles: { fontSize: 8, cellPadding: 1 },
      columnStyles: {
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
      },
    })
    doc.save("documents.pdf")
  }

  // Handle file download
  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, "_blank")
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
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
                        <th className="p-3 text-left font-medium text-white text-sm">Name</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Description</th>
                        <th className="p-3 text-left font-medium text-white text-sm">File URL</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Created At</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Updated At</th>
                        <th className="p-3 text-left font-medium text-white text-sm w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-gray-500">
                            No documents found.
                          </td>
                        </tr>
                      ) : (
                        documents.map((item) => {
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
                              <td className="p-3 text-sm">{item.name}</td>
                              <td className="p-3 text-sm max-w-[300px] truncate">{item.description}</td>
                              <td className="p-3 text-sm max-w-[200px] truncate">
                                <a
                                  href={item.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {item.fileUrl}
                                </a>
                              </td>
                              <td className="p-3 text-sm">{item.createdAt || "N/A"}</td>
                              <td className="p-3 text-sm">{item.updatedAt || "N/A"}</td>
                              <td className="p-3 flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownload(item.fileUrl)
                                  }}
                                >
                                  <Download className="h-4 w-4 text-gray-500" />
                                </Button>
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

export default DocumentPage

