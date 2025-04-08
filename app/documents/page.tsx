"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Plus, Edit, Trash2, FileSpreadsheet, FileIcon as FilePdf } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

// Interface for documents
interface Document {
  _id: string
  name: string
  description: string
  title: string
  type: string
  revision: string
  originated: Date
  createdAt: Date
}

// Interface for form data
interface DocumentFormData {
  name: string
  description: string
  title: string
  type: string
  revision: string
  originated: string // We'll handle this as a string (date in YYYY-MM-DD format)
  createdAt: string
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
    title: "",
    type: "Document", // default to "Document"
    revision: "0", // default to "0"
    originated: "", // default to empty string
    createdAt: "", // default to empty string
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
      item.title,
      item.type,
      item.revision,
      new Date(item.originated).toLocaleDateString(),
      new Date(item.createdAt).toLocaleDateString(),
    ])

    doc.autoTable({
      head: [["Name", "Description", "Title", "Type", "Revision", "Originated", "Created At"]],
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
      title: "",
      type: "Document", // default to "Document"
      revision: "0", // default to "0"
      originated: new Date().toISOString().split("T")[0], // Default to today
      createdAt: new Date().toISOString().split("T")[0], // Default to today
    })
    setIsCreateDialogOpen(true)
  }

  // Add a debug function to help troubleshoot the edit functionality
  const debugDocumentData = (document: Document | null) => {
    if (!document) {
      console.log("No document selected for debugging")
      return
    }

    console.log("Document data:", {
      id: document._id,
      name: document.name,
      description: document.description,
      title: document.title,
      type: document.type,
      revision: document.revision,
      originated: document.originated,
      createdAt: document.createdAt,
    })
  }

  // Open edit document dialog
  const openEditDialog = (document: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentDocument(document)

    // Format dates properly for the form
    const originatedDate = new Date(document.originated)
    const createdAtDate = new Date(document.createdAt)

    setFormData({
      name: document.name,
      description: document.description,
      title: document.title,
      type: document.type,
      revision: document.revision,
      originated: originatedDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
      createdAt: createdAtDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
    })

    // Make sure to set this to true to open the dialog
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

    // Validate required fields
    if (
      !formData.name ||
      !formData.description ||
      !formData.title ||
      !formData.type ||
      !formData.revision ||
      !formData.originated
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("https://skyronerp.onrender.com/api/documents/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          originated: new Date(formData.originated).toISOString(),
          createdAt: new Date(formData.createdAt || new Date()).toISOString(),
        }),
      })

      if (response.status === 409) {
        toast({
          title: "Error",
          description: "A document with this type, name, and revision already exists",
          variant: "destructive",
        })
        return
      }

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

    // Validate required fields
    if (
      !formData.name ||
      !formData.description ||
      !formData.title ||
      !formData.type ||
      !formData.revision ||
      !formData.originated
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      // Log the data being sent for debugging
      console.log("Updating document with data:", {
        ...formData,
        originated: new Date(formData.originated).toISOString(),
        createdAt: new Date(formData.createdAt).toISOString(),
      })

      const response = await fetch(`https://skyronerp.onrender.com/api/documents/${currentDocument._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          originated: new Date(formData.originated).toISOString(),
          createdAt: new Date(formData.createdAt).toISOString(),
        }),
      })

      // Log the response for debugging
      console.log("Update response status:", response.status)

      if (response.status === 409) {
        toast({
          title: "Error",
          description: "A document with this type, name, and revision already exists",
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(errorData.message || "Failed to update document")
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
        description: `Failed to update document: ${err instanceof Error ? err.message : "Unknown error"}`,
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
      <div className="flex flex-col h-full bg-slate-50">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
            <div className="flex space-x-2">
              <Button onClick={openCreateDialog} variant="default" size="sm" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
              <Button onClick={exportToExcel} variant="outline" size="sm" className="flex items-center">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline" size="sm" className="flex items-center">
                <FilePdf className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">{error}</div>}

          {!loading && !error && (
            <div className="bg-white rounded-lg border shadow-sm">
              <ScrollArea className="h-[calc(100vh-220px)] w-full">
                <Table>
                  <TableHeader className="bg-[#f79c34] text-white">
                    <TableRow >
                     
                      <TableHead >
                        <Checkbox
                          checked={documents.length > 0 && checkedItems.size === documents.length}
                          onCheckedChange={(checked) => {
                            setCheckedItems(checked ? new Set(documents.map((doc) => doc._id)) : new Set())
                          }}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Revision</TableHead>
                      <TableHead>Originated</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((item) => {
                      const isChecked = checkedItems.has(item._id)
                      const isSelected = selectedRow === item._id
                      return (
                        <TableRow
                          key={item._id}
                          className={`cursor-pointer ${isSelected ? "bg-slate-100" : ""} ${
                            isChecked ? "bg-slate-50" : ""
                          }`}
                          onClick={() => selectRow(item._id)}
                        >
                          <TableCell className="p-2">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const updatedCheckedItems = new Set(checkedItems)
                                if (checked) {
                                  updatedCheckedItems.add(item._id)
                                } else {
                                  updatedCheckedItems.delete(item._id)
                                }
                                setCheckedItems(updatedCheckedItems)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Select ${item.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.revision}</TableCell>
                          <TableCell>{new Date(item.originated).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log("Edit button clicked for document:", item._id)
                                  debugDocumentData(item)
                                  openEditDialog(item, e)
                                }}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                onClick={(e) => openDeleteDialog(item, e)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {documents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No documents found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Create Document Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Document</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new document. Note: The combination of Type, Name, and Revision must
              be unique.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter document name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter document description"
                required
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div>
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter document title"
                required
                className="mt-1"
              />
            </div>

            {/* Type and Revision in one row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  placeholder="Enter document type"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Part of unique constraint</p>
              </div>
              <div>
                <Label htmlFor="revision">
                  Revision <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="revision"
                  name="revision"
                  value={formData.revision}
                  onChange={handleInputChange}
                  placeholder="Enter document revision"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Part of unique constraint</p>
              </div>
            </div>

            {/* Originated and Created At in one row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originated">
                  Originated <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="originated"
                  name="originated"
                  type="date"
                  value={formData.originated}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="createdAt">Created At</Label>
                <Input
                  id="createdAt"
                  name="createdAt"
                  type="date"
                  value={formData.createdAt}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Defaults to current date if empty</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createDocument} variant="default">
              Create Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          console.log("Edit dialog state changing to:", open)
          setIsEditDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Modify the details of the document. Note: The combination of Type, Name, and Revision must be unique.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter document name"
                required
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Part of unique constraint</p>
            </div>
            <div>
              <Label htmlFor="edit-description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter document description"
                required
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div>
              <Label htmlFor="edit-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter document title"
                required
                className="mt-1"
              />
            </div>

            {/* Type and Revision in one row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  placeholder="Enter document type"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Part of unique constraint</p>
              </div>
              <div>
                <Label htmlFor="edit-revision">
                  Revision <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-revision"
                  name="revision"
                  value={formData.revision}
                  onChange={handleInputChange}
                  placeholder="Enter document revision"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Part of unique constraint</p>
              </div>
            </div>

            {/* Originated and Created At in one row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-originated">
                  Originated <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-originated"
                  name="originated"
                  type="date"
                  value={formData.originated}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-createdAt">Created At</Label>
                <Input
                  id="edit-createdAt"
                  name="createdAt"
                  type="date"
                  value={formData.createdAt}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateDocument} variant="default">
              Update Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Document Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentDocument && (
              <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
                <p className="font-medium">You are about to delete:</p>
                <p>
                  <span className="font-medium">Name:</span> {currentDocument.name}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {currentDocument.type}
                </p>
                <p>
                  <span className="font-medium">Revision:</span> {currentDocument.revision}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={deleteDocument} variant="destructive" className="flex items-center">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default DocumentPage
