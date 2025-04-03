"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Minus, Plus } from "lucide-react"

// Interface for child item
export interface NestedChildItem {
  id: string
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
  children: NestedChildItem[]
  parentId: string | null
  level: number
}

interface RecursiveChildFormProps {
  child: NestedChildItem
  onUpdate: (updatedChild: NestedChildItem) => void
  onRemove: () => void
  level: number
}

const RecursiveChildForm: React.FC<RecursiveChildFormProps> = ({ child, onUpdate, onRemove, level }) => {
  // Handle form field changes
  const handleChange = (field: keyof NestedChildItem, value: string | boolean) => {
    onUpdate({
      ...child,
      [field]: value,
    })
  }

  // Add a new child to this item
  const addChild = () => {
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
      parentId: child.id,
      level: child.level + 1,
    }

    onUpdate({
      ...child,
      children: [...child.children, newChild],
    })
  }

  // Update a specific child
  const updateChild = (index: number, updatedChild: NestedChildItem) => {
    const updatedChildren = [...child.children]
    updatedChildren[index] = updatedChild

    onUpdate({
      ...child,
      children: updatedChildren,
    })
  }

  // Remove a specific child
  const removeChild = (index: number) => {
    const updatedChildren = child.children.filter((_, i) => i !== index)

    onUpdate({
      ...child,
      children: updatedChildren,
    })
  }

  // Calculate left margin based on level for visual hierarchy
  const marginLeft = `${level * 12}px`

  return (
    <div className="border p-4 rounded-md space-y-4 mt-4" style={{ marginLeft }}>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full mr-2">{level}</div>
          <h4 className="font-medium">Child Item (Level {level})</h4>
        </div>
        <div className="flex space-x-2">
          <Button type="button" variant="outline" size="sm" onClick={addChild} className="flex items-center">
            <Plus className="h-4 w-4 mr-1" /> Add Sub-Child
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
          >
            <Minus className="h-4 w-4 mr-1" /> Remove
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`child-${child.id}-title`}>Title</Label>
          <Input
            id={`child-${child.id}-title`}
            value={child.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Enter title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`child-${child.id}-position_matrix`}>Position Matrix</Label>
          <Input
            id={`child-${child.id}-position_matrix`}
            value={child.position_matrix}
            onChange={(e) => handleChange("position_matrix", e.target.value)}
            placeholder="Enter position matrix"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`child-${child.id}-revision`}>Revision</Label>
          <Input
            id={`child-${child.id}-revision`}
            value={child.revision}
            onChange={(e) => handleChange("revision", e.target.value)}
            placeholder="Enter revision"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`child-${child.id}-type`}>Type</Label>
          <Input
            id={`child-${child.id}-type`}
            value={child.type}
            onChange={(e) => handleChange("type", e.target.value)}
            placeholder="Enter type"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`child-${child.id}-description`}>Description</Label>
        <Textarea
          id={`child-${child.id}-description`}
          value={child.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`child-${child.id}-owner`}>Owner</Label>
          <Input
            id={`child-${child.id}-owner`}
            value={child.owner}
            onChange={(e) => handleChange("owner", e.target.value)}
            placeholder="Enter owner"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`child-${child.id}-name`}>Name</Label>
          <Input
            id={`child-${child.id}-name`}
            value={child.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`child-${child.id}-lock`}
            checked={child.lock}
            onCheckedChange={(checked) => handleChange("lock", checked as boolean)}
          />
          <Label htmlFor={`child-${child.id}-lock`}>Lock</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`child-${child.id}-is_revision`}
            checked={child.is_revision}
            onCheckedChange={(checked) => handleChange("is_revision", checked as boolean)}
          />
          <Label htmlFor={`child-${child.id}-is_revision`}>Is Revision</Label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`child-${child.id}-maturity_state`}>Maturity State</Label>
          <Input
            id={`child-${child.id}-maturity_state`}
            value={child.maturity_state}
            onChange={(e) => handleChange("maturity_state", e.target.value)}
            placeholder="Enter maturity state"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`child-${child.id}-ca`}>CA</Label>
          <Input
            id={`child-${child.id}-ca`}
            value={child.ca}
            onChange={(e) => handleChange("ca", e.target.value)}
            placeholder="Enter CA"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`child-${child.id}-enterprise_item`}>Enterprise Item</Label>
        <Input
          id={`child-${child.id}-enterprise_item`}
          value={child.enterprise_item}
          onChange={(e) => handleChange("enterprise_item", e.target.value)}
          placeholder="Enter enterprise item"
        />
      </div>

      {/* Render children recursively */}
      {child.children.length > 0 && (
        <div className="space-y-4 mt-4 border-l-2 border-gray-200 pl-4">
          <h5 className="font-medium text-sm text-gray-500">Sub-Children</h5>
          {child.children.map((childItem, index) => (
            <RecursiveChildForm
              key={childItem.id}
              child={childItem}
              onUpdate={(updatedChild) => updateChild(index, updatedChild)}
              onRemove={() => removeChild(index)}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RecursiveChildForm

