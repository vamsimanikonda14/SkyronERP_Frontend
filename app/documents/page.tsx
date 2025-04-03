"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Eye, AlertCircle, FileText, FileSpreadsheet, Download, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
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

// Interface for form data
interface DocumentFormData {
  name: string
  description: string
  fileUrl: string
}

const DocumentPage = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [formData, setFormData] = useState<DocumentFormData>({
    name: "",
    description: "",
    fileUrl: "",
  })
  const router = useRouter()

  useEffect(() => {
    fetchDocuments()
  }, [router])

  const fetchDocuments = async () => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    setLoading(true)
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Open create document dialog
  const openCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      fileUrl: "",
    })
    setIsCreateDialogOpen(true)
  }

  // Open edit document dialog
  const openEditDialog = (document: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentDocument(document)
    setFormData({
      name: document.name,
      description: document.description,
      fileUrl: document.fileUrl,
    })
    setIsEditDialogOpen(true)
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (document: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentDocument(document)
    setIsDeleteDialogOpen(true)
  }

  // Create document
  const createDocument = async () => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch("https://skyronerp.onrender.com/api/documents/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create document")
      }

      await fetchDocuments()
      setIsCreateDialogOpen(false)
      toast({
        title: "Success",
        description: "Document created successfully",
      })
    } catch (err) {
      console.error("Error creating document:", err)
      toast({
        title: "Error",
        description: "Failed to create document. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update document
  const updateDocument = async () => {
    if (!currentDocument) return

    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch(`https://skyronerp.onrender.com/api/documents/${currentDocument._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update document")
      }

      await fetchDocuments()
      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Document updated successfully",
      })
    } catch (err) {
      console.error("Error updating document:", err)
      toast({
        title: "Error",
        description: "Failed to update document. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete document
  const deleteDocument = async () => {
    if (!currentDocument) return

    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch(`https://skyronerp.onrender.com/api/documents/${currentDocument._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete document")
      }

      await fetchDocuments()
      setIsDeleteDialogOpen(false)
      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting document:", err)
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <div className="flex space-x-2">
            <Button onClick={openCreateDialog} variant="default" size="sm" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
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
                        <th className="p-3 text-left font-medium text-white text-sm w-32">Actions</th>
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(item.fileUrl, "_blank")
                                  }}
                                >
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => openEditDialog(item, e)}
                                >
                                  <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => openDeleteDialog(item, e)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Create Document Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Document name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Document description"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fileUrl">File URL</Label>
              <Input
                id="fileUrl"
                name="fileUrl"
                value={formData.fileUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/file.pdf"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createDocument}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Document name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Document description"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-fileUrl">File URL</Label>
              <Input
                id="edit-fileUrl"
                name="fileUrl"
                value={formData.fileUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/file.pdf"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateDocument}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the document "{currentDocument?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteDocument}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default DocumentPage

