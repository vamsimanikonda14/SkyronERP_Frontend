"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Minus, Plus, Eye, AlertCircle, FileText, FileSpreadsheet, ChevronDown, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import RecursiveChildForm, { type NestedChildItem } from "@/components/recursive-child-form"
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

// Interface for form data
interface BomFormData {
  _id?: string
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
}

const EbomPage = () => {
  const [bomData, setBomData] = useState<BomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const router = useRouter()

  // Form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<BomFormData>({
    parent_part: "",
    title: "",
    position_matrix: "",
    revision: "",
    type: "",
    description: "",
    owner: "",
    name: "",
    lock: false,
    is_revision: false,
    maturity_state: "",
    ca: "",
    enterprise_item: "",
  })
  const [nestedChildren, setNestedChildren] = useState<NestedChildItem[]>([])
  const [currentItemId, setCurrentItemId] = useState<string>("")

  useEffect(() => {
    fetchBomData()
  }, [router])

  const fetchBomData = async () => {
    const token = localStorage.getItem("authToken")

    if (!token) {
      router.push("/")
      return
    }

    setLoading(true)
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

  // Handle checkbox change
  const handleCheckboxChange = (id: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row selection when checking
    const updatedCheckedItems = new Set(checkedItems)

    if (updatedCheckedItems.has(id)) {
      updatedCheckedItems.delete(id)
    } else {
      updatedCheckedItems.add(id)
    }

    setCheckedItems(updatedCheckedItems)
  }

  // Get all selected items and their children
  const getSelectedItemsWithChildren = (): BomItem[] => {
    if (checkedItems.size === 0) {
      // If no items are checked, return all data
      return bomData
    }

    // Create a map for quick lookup
    const itemMap = new Map<string, BomItem>()
    const flattenedData = flattenBomData(bomData)
    flattenedData.forEach((item) => {
      itemMap.set(item._id, item)
    })

    // Function to collect an item and all its children
    const collectItemWithChildren = (itemId: string, result: Set<string> = new Set()): Set<string> => {
      const item = itemMap.get(itemId)
      if (!item) return result

      result.add(itemId)

      if (item.children && item.children.length > 0) {
        item.children.forEach((child) => {
          collectItemWithChildren(child._id, result)
        })
      }

      return result
    }

    // Collect all selected items and their children
    const selectedItemIds = new Set<string>()
    checkedItems.forEach((itemId) => {
      collectItemWithChildren(itemId, selectedItemIds)
    })

    // Filter the flattened data to include only selected items and their children
    return flattenedData.filter((item) => selectedItemIds.has(item._id))
  }

  // Find BOM item by ID (recursive)
  const findBomItemById = (items: BomItem[], id: string): BomItem | null => {
    for (const item of items) {
      if (item._id === id) {
        return item
      }
      if (item.children && item.children.length > 0) {
        const found = findBomItemById(item.children, id)
        if (found) {
          return found
        }
      }
    }
    return null
  }

  // Handle edit button click
  const handleEditClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row selection
    const item = findBomItemById(bomData, id)
    if (item) {
      setCurrentItemId(id)
      setFormData({
        _id: id,
        parent_part: item.parent_part,
        title: item.title,
        position_matrix: item.position_matrix,
        revision: item.revision,
        type: item.type,
        description: item.description,
        owner: item.owner,
        name: item.name,
        lock: item.lock,
        is_revision: item.is_revision,
        maturity_state: item.maturity_state,
        ca: item.ca,
        enterprise_item: item.enterprise_item,
      })
      setIsEditDialogOpen(true)
    }
  }

  // Handle delete button click
  const handleDeleteClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row selection
    setCurrentItemId(id)
    setIsDeleteDialogOpen(true)
  }

  // Handle form input change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle checkbox change in form
  const handleFormCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  // Add new top-level child
  const addNestedChild = () => {
    const newChild: NestedChildItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: "",
      position_matrix: "",
      revision: "",
      type: "",
      description: "",
      owner: "",
      name: "",
      lock: false,
      is_revision: false,
      maturity_state: "",
      ca: "",
      enterprise_item: "",
      children: [],
      parentId: null, // Top level child
      level: 1,
    }

    setNestedChildren([...nestedChildren, newChild])
  }

  // Update a specific nested child
  const updateNestedChild = (index: number, updatedChild: NestedChildItem) => {
    const updatedChildren = [...nestedChildren]
    updatedChildren[index] = updatedChild
    setNestedChildren(updatedChildren)
  }

  // Remove a specific nested child
  const removeNestedChild = (index: number) => {
    setNestedChildren(nestedChildren.filter((_, i) => i !== index))
  }

  // Reset form data
  const resetForm = () => {
    setFormData({
      parent_part: "",
      title: "",
      position_matrix: "",
      revision: "",
      type: "",
      description: "",
      owner: "",
      name: "",
      lock: false,
      is_revision: false,
      maturity_state: "",
      ca: "",
      enterprise_item: "",
    })
    setNestedChildren([])
    setCurrentItemId("")
  }

  // Flatten nested children structure for API calls
  const flattenNestedChildren = (
    items: NestedChildItem[],
    parentId: string | null = null,
    result: { item: NestedChildItem; parentId: string | null }[] = [],
  ): { item: NestedChildItem; parentId: string | null }[] => {
    items.forEach((item) => {
      // Add current item with its parent ID
      result.push({ item, parentId })

      // Process children recursively with current item as parent
      if (item.children && item.children.length > 0) {
        flattenNestedChildren(item.children, item.id, result)
      }
    })

    return result
  }

  // Create new EBOM with nested children
  const createEBOM = async () => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    try {
      // Create parent EBOM
      const parentResponse = await fetch("https://skyronerp.onrender.com/api/bom/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!parentResponse.ok) {
        throw new Error(`Failed to create EBOM: ${parentResponse.status} ${parentResponse.statusText}`)
      }

      const parentResult = await parentResponse.json()
      const parentId = parentResult.bomData._id

      // Process nested children if any
      if (nestedChildren.length > 0) {
        // Flatten the nested structure for sequential creation
        const flattenedItems = flattenNestedChildren(nestedChildren)

        // Map of temporary IDs to actual database IDs
        const idMap = new Map<string, string>()

        // Create each item in sequence
        for (const { item, parentId } of flattenedItems) {
          // Determine the actual parent ID (either the root parent or a previously created child)
          let actualParentId = parentId === null ? parentId : idMap.get(parentId) || null

          // For top-level children, use the parent EBOM ID
          if (actualParentId === null && item.level === 1) {
            actualParentId = parentId
          }

          // Prepare item data for API
          const itemData = {
            parent_part: actualParentId || "",
            title: item.title,
            position_matrix: item.position_matrix,
            revision: item.revision,
            type: item.type,
            description: item.description,
            owner: item.owner,
            name: item.name,
            lock: item.lock,
            is_revision: item.is_revision,
            maturity_state: item.maturity_state,
            ca: item.ca,
            enterprise_item: item.enterprise_item,
          }

          // Create the item
          const response = await fetch("https://skyronerp.onrender.com/api/bom/create", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(itemData),
          })

          if (!response.ok) {
            console.error("Failed to create child EBOM item")
            continue
          }

          // Store the mapping from temp ID to actual DB ID
          const result = await response.json()
          idMap.set(item.id, result.bomData._id)
        }
      }

      toast({
        title: "Success",
        description: "EBOM created successfully with all nested children",
      })

      // Reset form and refresh data
      resetForm()
      setIsCreateDialogOpen(false)
      fetchBomData()
    } catch (err) {
      console.error("Error creating EBOM:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create EBOM",
        variant: "destructive",
      })
    }
  }

  // Update existing EBOM
  const updateEBOM = async () => {
    const token = localStorage.getItem("authToken")
    if (!token || !currentItemId) {
      return
    }

    try {
      const response = await fetch(`https://skyronerp.onrender.com/api/bom/${currentItemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Failed to update EBOM: ${response.status} ${response.statusText}`)
      }

      toast({
        title: "Success",
        description: "EBOM updated successfully",
      })

      // Reset form and refresh data
      resetForm()
      setIsEditDialogOpen(false)
      fetchBomData()
    } catch (err) {
      console.error("Error updating EBOM:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update EBOM",
        variant: "destructive",
      })
    }
  }

  // Delete EBOM
  const deleteEBOM = async () => {
    const token = localStorage.getItem("authToken")
    if (!token || !currentItemId) {
      return
    }

    try {
      const response = await fetch(`https://skyronerp.onrender.com/api/bom/${currentItemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete EBOM: ${response.status} ${response.statusText}`)
      }

      toast({
        title: "Success",
        description: "EBOM deleted successfully",
      })

      // Reset and refresh data
      setIsDeleteDialogOpen(false)
      fetchBomData()
    } catch (err) {
      console.error("Error deleting EBOM:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete EBOM",
        variant: "destructive",
      })
    }
  }

  // Recursive function to render BOM items with proper hierarchy
  const renderBomItem = (item: BomItem, level = 0, parentPath = "") => {
    const isExpanded = expandedRows.has(item._id)
    const isSelected = selectedRow === item._id
    const isChecked = checkedItems.has(item._id)
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
            checked={isChecked}
            onChange={() => {}} // React requires onChange handler
            onClick={(e) => handleCheckboxChange(item._id, e)}
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
        <td className="p-3">{item.lock ? "True" : "False"}</td>
        <td className="p-3">{item.is_revision ? "True" : "False"}</td>
        <td className="p-3">{item.maturity_state}</td>
        <td className="p-3">{item.ca}</td>
        <td className="p-3">{item.enterprise_item}</td>
        <td className="p-3 w-24">
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEditClick(item._id, e)}>
              <Edit className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleDeleteClick(item._id, e)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
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
          <td className="p-3 w-24">
            <Skeleton className="h-8 w-20 rounded-md" />
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
    // Get selected items or all items if none selected
    const selectedItems = getSelectedItemsWithChildren()

    // Flatten the hierarchical data
    const flatData = flattenBomData(selectedItems)

    // Prepare data for Excel
    const excelData = flatData.map((item) => ({
      Title: "  ".repeat(item.level) + item.title,
      "Position Matrix": item.position_matrix,
      Revision: item.revision,
      Type: item.type,
      Description: item.description,
      Owner: item.owner,
      Name: item.name,
      Lock: item.lock ? "True" : "False",
      "Is Revision": item.is_revision ? "True" : "False",
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

    // Get selected items or all items if none selected
    const selectedItems = getSelectedItemsWithChildren()

    // Flatten the hierarchical data
    const flatData = flattenBomData(selectedItems)

    // Prepare data for PDF
    const tableData = flatData.map((item) => [
      "  ".repeat(item.level) + item.title,
      item.position_matrix,
      item.revision,
      item.type,
      item.description,
      item.owner,
      item.name,
      item.lock ? "True" : "False",
      item.is_revision ? "True" : "False",
      item.maturity_state,
      item.ca,
      item.enterprise_item,
    ])

    // Add title
    doc.setFontSize(18)
    doc.text("EBOM Export", 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

    // Add selection info if applicable
    if (checkedItems.size > 0) {
      doc.text(`Selected items: ${checkedItems.size}`, 14, 36)
    }

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
      startY: checkedItems.size > 0 ? 42 : 40,
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
                  Export to Excel {checkedItems.size > 0 ? `(${checkedItems.size} selected)` : "(all)"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export to PDF {checkedItems.size > 0 ? `(${checkedItems.size} selected)` : "(all)"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              Add Item
            </Button>
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
                  <th className="p-3 text-left w-24">Actions</th>
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

      {/* Create EBOM Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New EBOM</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new EBOM. You can also add nested children to any depth.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Enter title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position_matrix">Position Matrix</Label>
                <Input
                  id="position_matrix"
                  name="position_matrix"
                  value={formData.position_matrix}
                  onChange={handleFormChange}
                  placeholder="Enter position matrix"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revision">Revision</Label>
                <Input
                  id="revision"
                  name="revision"
                  value={formData.revision}
                  onChange={handleFormChange}
                  placeholder="Enter revision"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  placeholder="Enter type"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Enter description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  name="owner"
                  value={formData.owner}
                  onChange={handleFormChange}
                  placeholder="Enter owner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lock"
                  checked={formData.lock}
                  onCheckedChange={(checked) => handleFormCheckboxChange("lock", checked as boolean)}
                />
                <Label htmlFor="lock">Lock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_revision"
                  checked={formData.is_revision}
                  onCheckedChange={(checked) => handleFormCheckboxChange("is_revision", checked as boolean)}
                />
                <Label htmlFor="is_revision">Is Revision</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maturity_state">Maturity State</Label>
                <Input
                  id="maturity_state"
                  name="maturity_state"
                  value={formData.maturity_state}
                  onChange={handleFormChange}
                  placeholder="Enter maturity state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ca">CA</Label>
                <Input id="ca" name="ca" value={formData.ca} onChange={handleFormChange} placeholder="Enter CA" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="enterprise_item">Enterprise Item</Label>
              <Input
                id="enterprise_item"
                name="enterprise_item"
                value={formData.enterprise_item}
                onChange={handleFormChange}
                placeholder="Enter enterprise item"
              />
            </div>

            {/* Nested Children Section */}
            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Child Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addNestedChild}>
                  Add Child Item
                </Button>
              </div>

              {nestedChildren.map((child, index) => (
                <RecursiveChildForm
                  key={child.id}
                  child={child}
                  onUpdate={(updatedChild) => updateNestedChild(index, updatedChild)}
                  onRemove={() => removeNestedChild(index)}
                  level={1}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createEBOM}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit EBOM Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit EBOM</DialogTitle>
            <DialogDescription>Update the details of the selected EBOM.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Enter title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position_matrix">Position Matrix</Label>
                <Input
                  id="edit-position_matrix"
                  name="position_matrix"
                  value={formData.position_matrix}
                  onChange={handleFormChange}
                  placeholder="Enter position matrix"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-revision">Revision</Label>
                <Input
                  id="edit-revision"
                  name="revision"
                  value={formData.revision}
                  onChange={handleFormChange}
                  placeholder="Enter revision"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Input
                  id="edit-type"
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  placeholder="Enter type"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Enter description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-owner">Owner</Label>
                <Input
                  id="edit-owner"
                  name="owner"
                  value={formData.owner}
                  onChange={handleFormChange}
                  placeholder="Enter owner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-lock"
                  checked={formData.lock}
                  onCheckedChange={(checked) => handleFormCheckboxChange("lock", checked as boolean)}
                />
                <Label htmlFor="edit-lock">Lock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is_revision"
                  checked={formData.is_revision}
                  onCheckedChange={(checked) => handleFormCheckboxChange("is_revision", checked as boolean)}
                />
                <Label htmlFor="edit-is_revision">Is Revision</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-maturity_state">Maturity State</Label>
                <Input
                  id="edit-maturity_state"
                  name="maturity_state"
                  value={formData.maturity_state}
                  onChange={handleFormChange}
                  placeholder="Enter maturity state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ca">CA</Label>
                <Input id="edit-ca" name="ca" value={formData.ca} onChange={handleFormChange} placeholder="Enter CA" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-enterprise_item">Enterprise Item</Label>
              <Input
                id="edit-enterprise_item"
                name="enterprise_item"
                value={formData.enterprise_item}
                onChange={handleFormChange}
                placeholder="Enter enterprise item"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateEBOM}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this EBOM? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteEBOM}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default EbomPage

