"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Eye, AlertCircle, FileText, FileSpreadsheet, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Interface for requested part data
interface RequestedPart {
  part: string
  quantity: number
  parentPart: string
  description: string
  status: "Pending" | "Approved" | "Rejected"
  requestDate: string
}

// Interface for requests
interface Request {
  _id: string
  user: string
  requestedParts: RequestedPart[]
  status: "Pending" | "Approved" | "Rejected"
  createdAt: string
  updatedAt: string
}

// Interface for request form data
interface RequestFormData {
  requestedParts: RequestedPart[]
}

const RequestPage = () => {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null)
  const [formData, setFormData] = useState<RequestFormData>({ requestedParts: [] })
  const router = useRouter()

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("https://skyronerp.onrender.com/api/requests/allrequests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch requests")
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        // API is returning the array directly
        setRequests(data)
      } else if (Array.isArray(data.requests)) {
        // API is returning { requests: [...] }
        setRequests(data.requests)
      } else {
        console.error("Expected an array of requests, but received:", data)
        setError("Invalid data format received from server")
      }
    } catch (err) {
      console.error("Error fetching requests:", err)
      setError("Failed to load requests. Please try again later.")
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

  // Get selected requests
  const getSelectedItems = (): Request[] => {
    if (checkedItems.size === 0) {
      return requests
    }

    return requests.filter((item) => checkedItems.has(item._id))
  }

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(getSelectedItems())
    XLSX.utils.book_append_sheet(wb, ws, "Requests")
    XLSX.writeFile(wb, "requests.xlsx")
  }

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    const data = getSelectedItems().map((item) => [
      item.user,
      item.status,
      formatDate(item.createdAt),
      formatDate(item.updatedAt),
      item.requestedParts.length.toString() + " parts",
    ])

    doc.autoTable({
      head: [["User", "Status", "Created At", "Updated At", "Parts Count"]],
      body: data,
      styles: { fontSize: 8, cellPadding: 1 },
      columnStyles: {
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
      },
    })
    doc.save("requests.pdf")
  }

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    field: string,
  ) => {
    const { value } = e.target
    const updatedRequestedParts = [...formData.requestedParts]

    updatedRequestedParts[index] = {
      ...updatedRequestedParts[index],
      [field]: field === "quantity" ? Number(value) : value,
    }

    setFormData({
      ...formData,
      requestedParts: updatedRequestedParts,
    })
  }

  // Handle select changes for status
  const handleStatusChange = (value: string, index: number) => {
    const status = value as "Pending" | "Approved" | "Rejected"
    const updatedRequestedParts = [...formData.requestedParts]

    updatedRequestedParts[index] = {
      ...updatedRequestedParts[index],
      status,
    }

    setFormData({
      ...formData,
      requestedParts: updatedRequestedParts,
    })
  }

  // Add new part to form
  const addPartToForm = () => {
    setFormData({
      ...formData,
      requestedParts: [
        ...formData.requestedParts,
        {
          part: "",
          quantity: 1,
          parentPart: "",
          description: "",
          status: "Pending",
          requestDate: new Date().toISOString(),
        },
      ],
    })
  }

  // Remove part from form
  const removePartFromForm = (index: number) => {
    const updatedParts = [...formData.requestedParts]
    updatedParts.splice(index, 1)
    setFormData({
      ...formData,
      requestedParts: updatedParts,
    })
  }

  // Open create request dialog
  const openCreateDialog = () => {
    setFormData({
      requestedParts: [
        {
          part: "",
          quantity: 1,
          parentPart: "",
          description: "",
          status: "Pending",
          requestDate: new Date().toISOString(),
        },
      ],
    })
    setIsCreateDialogOpen(true)
  }

  // Open edit request dialog
  const openEditDialog = (request: Request, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentRequest(request)
    setFormData({ requestedParts: [...request.requestedParts] })
    setIsEditDialogOpen(true)
  }

  // Open delete request dialog
  const openDeleteDialog = (request: Request, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentRequest(request)
    setIsDeleteDialogOpen(true)
  }

  // Open view request dialog
  const openViewDialog = (request: Request, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentRequest(request)
    setIsViewDialogOpen(true)
  }

  // Create request
  const createRequest = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/");
      return;
    }
  
    try {
      const response = await fetch("https://skyronerp.onrender.com/api/requests/newrequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData), // Ensure formData contains all necessary fields
      });
  
      // Log the response status and body for debugging
      console.log("Response Status:", response.status);
      console.log("Response Body:", await response.text());
  
      if (!response.ok) {
        throw new Error("Failed to create request");
      }
  
      await fetchRequests();  // Refetch the requests after creating a new one
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Request created successfully" });
    } catch (err) {
      console.error("Error creating request:", err);
      toast({
        title: "Error",
        description: "Failed to create request. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Update request
  const updateRequest = async () => {
    if (!currentRequest) return

    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    try {
      // Update the entire request with all parts
      const response = await fetch(`https://skyronerp.onrender.com/api/requests/request/${currentRequest._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update request")
      }

      await fetchRequests()
      setIsEditDialogOpen(false)
      toast({ title: "Success", description: "Request updated successfully" })
    } catch (err) {
      console.error("Error updating request:", err)
      toast({
        title: "Error",
        description: "Failed to update request. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update request status only
  const updateRequestStatus = async (requestId: string, status: "Pending" | "Approved" | "Rejected") => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch(`https://skyronerp.onrender.com/api/requests/request/${requestId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update request status")
      }

      await fetchRequests()
      toast({ title: "Success", description: "Request status updated successfully" })
    } catch (err) {
      console.error("Error updating request status:", err)
      toast({
        title: "Error",
        description: "Failed to update request status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete request
  const deleteRequest = async () => {
    if (!currentRequest) return

    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch(`https://skyronerp.onrender.com/api/requests/request/${currentRequest._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete request")
      }

      await fetchRequests()
      setIsDeleteDialogOpen(false)
      toast({ title: "Success", description: "Request deleted successfully" })
    } catch (err) {
      console.error("Error deleting request:", err)
      toast({
        title: "Error",
        description: "Failed to delete request. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch (error) {
      return dateString
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <div className="flex space-x-2">
            <Button onClick={openCreateDialog} variant="default" size="sm" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Request
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
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-orange-500 text-white sticky top-0 z-10">
                      <tr>
                        <th className="p-3 text-left w-10">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            onChange={(e) => {
                              setCheckedItems(e.target.checked ? new Set(requests.map((r) => r._id)) : new Set())
                            }}
                          />
                        </th>
                        <th className="p-3 text-left">User</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Created At</th>
                        <th className="p-3 text-left">Updated At</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">
                            No requests found
                          </td>
                        </tr>
                      ) : (
                        requests.map((request) => (
                          <tr
                            key={request._id}
                            className={`border-b cursor-pointer hover:bg-orange-50 ${selectedRow === request._id ? "bg-orange-100" : ""}`}
                            onClick={() => selectRow(request._id)}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={checkedItems.has(request._id)}
                                onClick={(e) => handleCheckboxChange(request._id, e)}
                                readOnly
                              />
                            </td>
                            <td className="p-3">{request.user}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  request.status === "Approved"
                                    ? "bg-green-100 text-green-800"
                                    : request.status === "Rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {request.status}
                              </span>
                            </td>
                            <td className="p-3">{formatDate(request.createdAt)}</td>
                            <td className="p-3">{formatDate(request.updatedAt)}</td>
                            <td className="p-3 text-center">
                              <Button
                                onClick={(e) => openEditDialog(request, e)}
                                variant="outline"
                                size="sm"
                                className="mr-2"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={(e) => openDeleteDialog(request, e)}
                                variant="outline"
                                size="sm"
                                className="mr-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button onClick={(e) => openViewDialog(request, e)} variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <div className="ml-2 inline-block">
                                <Select
                                  defaultValue={request.status}
                                  onValueChange={(value) => {
                                    const status = value as "Pending" | "Approved" | "Rejected"
                                    updateRequestStatus(request._id, status)
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-24">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {formData.requestedParts.map((part, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg relative">
                {formData.requestedParts.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removePartFromForm(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`part-${index}`}>Part</Label>
                    <Input
                      id={`part-${index}`}
                      name="part"
                      value={part.part}
                      onChange={(e) => handleInputChange(e, index, "part")}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      name="quantity"
                      type="number"
                      min="1"
                      value={part.quantity}
                      onChange={(e) => handleInputChange(e, index, "quantity")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`parentPart-${index}`}>Parent Part</Label>
                  <Input
                    id={`parentPart-${index}`}
                    name="parentPart"
                    value={part.parentPart}
                    onChange={(e) => handleInputChange(e, index, "parentPart")}
                  />
                </div>

                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Textarea
                    id={`description-${index}`}
                    name="description"
                    value={part.description}
                    onChange={(e) => handleInputChange(e, index, "description")}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor={`status-${index}`}>Status</Label>
                  <Select value={part.status} onValueChange={(value) => handleStatusChange(value, index)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addPartToForm} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Part
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createRequest}>Create Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {formData.requestedParts.map((part, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg relative">
                {formData.requestedParts.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removePartFromForm(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`edit-part-${index}`}>Part</Label>
                    <Input
                      id={`edit-part-${index}`}
                      name="part"
                      value={part.part}
                      onChange={(e) => handleInputChange(e, index, "part")}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edit-quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`edit-quantity-${index}`}
                      name="quantity"
                      type="number"
                      min="1"
                      value={part.quantity}
                      onChange={(e) => handleInputChange(e, index, "quantity")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`edit-parentPart-${index}`}>Parent Part</Label>
                  <Input
                    id={`edit-parentPart-${index}`}
                    name="parentPart"
                    value={part.parentPart}
                    onChange={(e) => handleInputChange(e, index, "parentPart")}
                  />
                </div>

                <div>
                  <Label htmlFor={`edit-description-${index}`}>Description</Label>
                  <Textarea
                    id={`edit-description-${index}`}
                    name="description"
                    value={part.description}
                    onChange={(e) => handleInputChange(e, index, "description")}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor={`edit-status-${index}`}>Status</Label>
                  <Select value={part.status} onValueChange={(value) => handleStatusChange(value, index)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addPartToForm} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Part
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateRequest}>Update Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Request Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this request? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteRequest}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Request Details</DialogTitle>
          </DialogHeader>
          {currentRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">User</p>
                  <p>{currentRequest.user}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        currentRequest.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : currentRequest.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {currentRequest.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p>{formatDate(currentRequest.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Updated At</p>
                  <p>{formatDate(currentRequest.updatedAt)}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Requested Parts</h3>
                <div className="space-y-4">
                  {currentRequest.requestedParts.map((part, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Part</p>
                          <p>{part.part}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Quantity</p>
                          <p>{part.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Parent Part</p>
                          <p>{part.parentPart || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <p>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                part.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : part.status === "Rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {part.status}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Request Date</p>
                          <p>{formatDate(part.requestDate)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-500">Description</p>
                        <p className="whitespace-pre-wrap">{part.description || "No description provided"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default RequestPage

