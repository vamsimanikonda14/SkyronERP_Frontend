"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { AlertCircle, FileText, FileSpreadsheet, Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"

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

// Form validation schema
const documentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  revision: z.string().min(1, "Revision is required"),
  originated: z.string().min(1, "Originated date is required"),
  createdAt: z.string().optional(),
})

type DocumentFormValues = z.infer<typeof documentFormSchema>

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Form setup for create/edit
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      title: "",
      type: "Document", // default to "Document"
      revision: "0", // default to "0"
      originated: new Date().toISOString().split("T")[0], // Default to today
      createdAt: new Date().toISOString().split("T")[0], // Default to today
    },
  })

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

  // Reset form with document data for editing
  const setupEditForm = (document: Document) => {
    const originatedDate = new Date(document.originated)
    const createdAtDate = new Date(document.createdAt)

    form.reset({
      name: document.name,
      description: document.description,
      title: document.title,
      type: document.type,
      revision: document.revision,
      originated: originatedDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
      createdAt: createdAtDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
    })
    setCurrentDocument(document)
    setIsEditDialogOpen(true)
  }

  // Open create document dialog
  const openCreateDialog = () => {
    form.reset({
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

  // Open delete confirmation dialog
  const openDeleteDialog = (document: Document, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentDocument(document)
    setIsDeleteDialogOpen(true)
  }

  // Handle form submission
  const onSubmit = (data: DocumentFormValues) => {
    if (isCreateDialogOpen) {
      createDocument(data)
    } else if (isEditDialogOpen) {
      updateDocument(data)
    }
  }

  // Create document
  const createDocument = async (data: DocumentFormValues) => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("https://skyronerp.onrender.com/api/documents/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          originated: new Date(data.originated).toISOString(),
          createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
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
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update document
  const updateDocument = async (data: DocumentFormValues) => {
    if (!currentDocument) return

    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`https://skyronerp.onrender.com/api/documents/${currentDocument._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          originated: new Date(data.originated).toISOString(),
          createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
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
    } finally {
      setIsSubmitting(false)
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

    setIsSubmitting(true)
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
    } finally {
      setIsSubmitting(false)
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
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={documents.length > 0 && checkedItems.size === documents.length}
                            onChange={(e) => {
                              setCheckedItems(e.target.checked ? new Set(documents.map((doc) => doc._id)) : new Set())
                            }}
                            aria-label="Select all"
                          />
                        </th>
                        <th className="p-3 text-left font-medium text-white text-sm">Name</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Description</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Title</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Type</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Revision</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Originated</th>
                        <th className="p-3 text-left font-medium text-white text-sm">Created At</th>
                        <th className="p-3 text-left font-medium text-white text-sm w-20">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center p-8 text-gray-500">
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
                              <td className="p-3 text-sm font-medium">{item.name}</td>
                              <td className="p-3 text-sm max-w-[200px] truncate">{item.description}</td>
                              <td className="p-3 text-sm">{item.title}</td>
                              <td className="p-3 text-sm">{item.type}</td>
                              <td className="p-3 text-sm">{item.revision}</td>
                              <td className="p-3 text-sm">{new Date(item.originated).toLocaleDateString()}</td>
                              <td className="p-3 text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                              <td className="p-3 w-20">
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setupEditForm(item)
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 text-gray-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => openDeleteDialog(item, e)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Document</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new document. Note: The combination of Type, Name, and Revision must
              be unique.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Document name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Document title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Document description" className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Document type" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Part of unique constraint</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="revision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revision</FormLabel>
                      <FormControl>
                        <Input placeholder="Document revision" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Part of unique constraint</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="originated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Originated</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="createdAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Created At</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Defaults to current date if empty</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Document"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Modify the details of the document. Note: The combination of Type, Name, and Revision must be unique.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Document name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Document title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Document description" className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Document type" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Part of unique constraint</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="revision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revision</FormLabel>
                      <FormControl>
                        <Input placeholder="Document revision" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Part of unique constraint</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="originated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Originated</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="createdAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Created At</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Document"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={deleteDocument} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default DocumentPage
