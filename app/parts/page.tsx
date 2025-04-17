"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { AlertCircle, FileText, FileSpreadsheet, Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"

// Interfaces for parts
interface Part {
  _id: string
  id:number
  type: string
  title: string
  name: string
  revision: string
  state: string
  created: string
  modified: string
  owner: string
  organization: string
  collabspace: string
}

// Form validation schema
const partFormSchema = z.object({
  id: z.number().optional(),
  type: z.string().default("-"),
  title: z.string().default("-"),
  name: z.string().default("-"),
  revision: z.string().min(1, "Revision is required"),
  state: z.string().default("-"),
  owner: z.string().default("-"),
  organization: z.string().default("-"),
  collabspace: z.string().default("-"),
})

type PartFormValues = z.infer<typeof partFormSchema>

const PartPage = () => {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const router = useRouter()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentPart, setCurrentPart] = useState<Part | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchParts = async () => {
    const token = localStorage.getItem("authToken")
    if (!token) return

    setLoading(true)
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
        console.log("Fetched parts:", data.parts)
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

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
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
      item.id,
      item.type,
      item.title,
      item.name,
      item.revision,
      item.state,
      item.created ? new Date(item.created).toLocaleDateString() : "-",
      item.modified ? new Date(item.modified).toLocaleDateString() : "-",
      item.owner,
      item.organization,
      item.collabspace,
    ])

    doc.autoTable({
      head: [
        [
          "ID",
          "Type",
          "Title",
          "Name",
          "Revision",
          "State",
          "Created",
          "Modified",
          "Owner",
          "Organization",
          "Collabspace",
        ],
      ],
      body: data,
      styles: { fontSize: 8, cellPadding: 1 },
      columnStyles: {
        0: { cellWidth: 10 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
      },
    })
    doc.save("parts.pdf")
  }

  // Form setup for create/edit
  const form = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: {
      id: 0,
      type: "-",
      title: "-",
      name: "-",
      revision: "",
      state: "-",
      owner: "-",
      organization: "-",
      collabspace: "-",
    },
  })

  // Reset form with part data for editing
  const setupEditForm = (part: Part) => {
    form.reset({
      id: part.id,
      type: part.type,
      title: part.title,
      name: part.name,
      revision: part.revision,
      state: part.state,
      owner: part.owner,
      organization: part.organization,
      collabspace: part.collabspace,
    })
    setCurrentPart(part)
    setIsEditDialogOpen(true)
  }

  // Open create dialog
  const openCreateDialog = () => {
    form.reset({
      id: 0,
      type: "-",
      title: "-",
      name: "-",
      revision: "",
      state: "-",
      owner: "-",
      organization: "-",
      collabspace: "-",
    })
    setIsCreateDialogOpen(true)
  }

  // Open delete confirmation
  const openDeleteDialog = (part: Part, event: React.MouseEvent) => {
    event.stopPropagation()
    setCurrentPart(part)
    setIsDeleteDialogOpen(true)
  }

  // Create a new part
  const createPart = async (data: PartFormValues) => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create parts",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      console.log("Sending data to API:", data)

      // Remove any undefined or null values
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v != null && v !== ""))

      const response = await fetch("https://skyronerp.onrender.com/api/parts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanData),
      })

      const responseText = await response.text()
      console.log("API Response:", response.status, responseText)

      if (!response.ok) {
        throw new Error(`Failed to create part: ${response.status} ${responseText}`)
      }

      // Parse the response if it's JSON
      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        console.error("Error parsing response:", e)
        // If we can't parse the response but the request was successful,
        // we'll just refresh the parts list
        fetchParts()
        setIsCreateDialogOpen(false)
        toast({
          title: "Success",
          description: "Part created successfully",
        })
        return
      }

      // Refresh parts list
      if (result.part) {
        const updatedParts = [...parts, result.part]
        setParts(updatedParts)
      } else {
        // If the API doesn't return the created part, refresh the list
        fetchParts()
      }

      setIsCreateDialogOpen(false)
      toast({
        title: "Success",
        description: "Part created successfully",
      })
    } catch (err) {
      console.error("Error creating part:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create part. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update an existing part
  const updatePart = async (data: PartFormValues) => {
    if (!currentPart) return

    const token = localStorage.getItem("authToken")
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to update parts",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      console.log("Updating part with data:", data)

      // Remove any undefined or null values
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v != null && v !== ""))

      const response = await fetch(`https://skyronerp.onrender.com/api/parts/${currentPart._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanData),
      })

      const responseText = await response.text()
      console.log("API Response:", response.status, responseText)

      if (!response.ok) {
        throw new Error(`Failed to update part: ${response.status} ${responseText}`)
      }

      // Refresh the parts list instead of trying to update locally
      fetchParts()

      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Part updated successfully",
      })
    } catch (err) {
      console.error("Error updating part:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update part. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete a part
  const deletePart = async () => {
    if (!currentPart) return

    const token = localStorage.getItem("authToken")
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to delete parts",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`https://skyronerp.onrender.com/api/parts/${currentPart._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const responseText = await response.text()
      console.log("API Response:", response.status, responseText)

      if (!response.ok) {
        throw new Error(`Failed to delete part: ${response.status} ${responseText}`)
      }

      // Update parts list
      const updatedParts = parts.filter((part) => part._id !== currentPart._id)
      setParts(updatedParts)

      setIsDeleteDialogOpen(false)
      toast({
        title: "Success",
        description: "Part deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting part:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete part. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form submission
  const onSubmit = (data: PartFormValues) => {
    if (isCreateDialogOpen) {
      createPart(data)
    } else if (isEditDialogOpen) {
      updatePart(data)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return dateString
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Parts Table</h1>
          <div className="flex space-x-2">
            <Button onClick={openCreateDialog} variant="default" size="sm" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Part
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
              <div className="relative">
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="min-w-[1200px]">
                    <table className="w-full table-auto">
                      <thead className="bg-orange-500 sticky top-0 z-10">
                        <tr>
                          <th className="p-3 text-left w-10">
                            <span className="sr-only">Select</span>
                          </th>
                          <th className="p-3 text-left font-medium text-white text-sm">ID</th>
                          <th className="p-3 text-left font-medium text-white text-sm">Type</th>
                          <th className="p-3 text-left font-medium text-white text-sm">Title</th>
                          <th className="p-3 text-left font-medium text-white text-sm">Name</th>
                          <th className="p-3 text-left font-medium text-white text-sm">Revision</th>
                          <th className="p-3 text-left font-medium text-white text-sm">State</th>
                          <th className="p-3 text-left font-medium text-white text-sm">Created</th>
                          <th className="p-3 text-left font-medium text-white text-sm">Modified</th>
                          <th className="p-3 text-left font-medium text-white text-sm">Owner</th>
                          <th className="p-3 text-left font-medium text-white text-sm">Organization</th>
                          <th className="p-3 text-left font-medium text-white text-sm">Collabspace</th>
                          <th className="p-3 text-left font-medium text-white text-sm w-20">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parts.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="text-center p-8 text-gray-500">
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
                                <td className="p-3 text-sm">{item.id || 0}</td>
                                <td className="p-3 text-sm">{item.type || "-"}</td>
                                <td className="p-3 text-sm">{item.title || "-"}</td>
                                <td className="p-3 text-sm">{item.name || "-"}</td>
                                <td className="p-3 text-sm">{item.revision || "-"}</td>
                                <td className="p-3 text-sm">{item.state || "-"}</td>
                                <td className="p-3 text-sm">{formatDate(item.created)}</td>
                                <td className="p-3 text-sm">{formatDate(item.modified)}</td>
                                <td className="p-3 text-sm">{item.owner || "-"}</td>
                                <td className="p-3 text-sm">{item.organization || "-"}</td>
                                <td className="p-3 text-sm">{item.collabspace || "-"}</td>
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
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Create Part Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Part</DialogTitle>
            <DialogDescription>Fill in the details to create a new part.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Part ID"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number.parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Part type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Part title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Part name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="revision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revision</FormLabel>
                      <FormControl>
                        <Input placeholder="Revision number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Part state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
                      <FormControl>
                        <Input placeholder="Owner name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="Organization name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="collabspace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collabspace</FormLabel>
                    <FormControl>
                      <Input placeholder="Collabspace" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Part"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Part Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Part</DialogTitle>
            <DialogDescription>Update the details of the selected part.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Part ID"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number.parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Part type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Part title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Part name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="revision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revision</FormLabel>
                      <FormControl>
                        <Input placeholder="Revision number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Part state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
                      <FormControl>
                        <Input placeholder="Owner name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="Organization name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="collabspace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collabspace</FormLabel>
                    <FormControl>
                      <Input placeholder="Collabspace" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Part"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this part? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={deletePart} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default PartPage
