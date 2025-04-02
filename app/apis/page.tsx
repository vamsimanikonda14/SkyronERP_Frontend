"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clipboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import DashboardLayout from "@/components/dashboard-layout"

interface ApiItem {
  name: string
  category: string
  url: string
  method: string
  payload: string | null
  response: string
  status: string
}

interface ApiCategories {
  [key: string]: ApiItem[]
}

export default function ApisPage() {
  const [apiData, setApiData] = useState<ApiItem[]>([])
  const [filteredApis, setFilteredApis] = useState<ApiItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [expandedApis, setExpandedApis] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    // Load API data
    const loadApiData = async () => {
      try {
        // Instead of fetching from a file, we'll use a hardcoded API data
        // In a real app, you would fetch this from your backend API
        const apiData = {
          apis: [
            {
              name: "SignUp Api",
              category: "user",
              url: "https://skyronerp.onrender.com/api/auth/signup",
              method: "POST",
              payload:
                '{"fullname": "your Full Name", "email": "user email for signup", "password": "password for signup"}',
              response: '{"success": true, "message": "User created Successfully"}',
              status: "Active",
            },
            {
              name: "user Login API",
              category: "user",
              url: "https://skyronerp.onrender.com/api/auth/login",
              method: "POST",
              payload: '{"email": "user email for login", "password": "password for login"}',
              response:
                '{"success": true, "message": "Login Successful", "user": {"_id": "xxxxxxxx", "email": "user email", "password": "user password bycrypt code", "fullname": "user fullname", "__v": 0}, "token": "---generated token---"}',
              status: "Active",
            },
            {
              name: "Get particular user",
              category: "user",
              url: "https://skyronerp.onrender.com/api/auth/profile/${id}",
              method: "GET",
              payload: null,
              response: '{"user": {"email": "user email id", "fullname": "user password"}}',
              status: "Active",
            },
            {
              name: "Update User",
              category: "user",
              url: "https://skyronerp.onrender.com/api/auth/update/${id}",
              method: "PUT",
              payload: '{"---update user data---"}',
              response: '{"success": true, "message": "User updated successfully"}',
              status: "Active",
            },
            {
              name: "List All users",
              category: "user",
              url: "https://skyronerp.onrender.com/api/auth/users",
              method: "GET",
              payload: "N/A",
              response: '{"users": [{"_id": "user id", "email": "user email", "fullname": "user fullname", "__v": 0}]}',
              status: "Active",
            },
            {
              name: "Delete User",
              category: "user",
              url: "https://skyronerp.onrender.com/api/auth/delete/${id}",
              method: "DELETE",
              payload: "Note: pass the token in authorization as bearer token",
              response: '{"success": true, "message": "User deleted successfully"}',
              status: "Active",
            },
            {
              name: "Create EBOM",
              category: "ebom",
              url: "https://skyronerp.onrender.com/api/bom/create",
              method: "POST",
              payload:
                '{"type": "type of EBOM", "name": "name of EBOM", "revision": "Revision Number", "partNumber": "EBOM part Number", "description": "EBOM Description", "quantityRequired": Number, "stockLevel": Number, "supplierInfo": "Supplier Info", "partWeight": "weight in kg", "uom": "unit of measure", "manufacturingInfo": "manufacturing Info", "inventoryLocation": "inventory Location"}',
              response:
                '{"success": true, "message": "BOM created successfully.", "newBOM": {"type": "type of EBOM", "name": "name of EBOM", "revision": "Revision Number", "partNumber": "EBOM part Number", "description": "EBOM Description", "quantityRequired": Number, "stockLevel": Number, "supplierInfo": "Supplier Info", "partWeight": "weight in kg", "uom": "unit of measure", "manufacturingInfo": "manufacturing Info", "inventoryLocation": "inventory Location", "_id": "object id", "createdAt": "created date", "updatedAt": "updated date", "__v": 0}}',
              status: "Active",
            },
            {
              name: "Get All EBOM",
              category: "ebom",
              url: "https://skyronerp.onrender.com/api/bom/",
              method: "GET",
              payload: "N/A",
              response:
                '{"bomData": [{"_id": "object id", "type": "type of EBOM", "name": "name of EBOM", "revision": "Revision Number", "partNumber": "EBOM part Number", "description": "EBOM Description", "quantityRequired": Number, "stockLevel": Number, "supplierInfo": "Supplier Info", "partWeight": "weight in kg", "uom": "unit of measure", "manufacturingInfo": "manufacturing Info", "inventoryLocation": "inventory Location", "createdAt": "created date", "updatedAt": "updated date", "__v": 0}]}',
              status: "Active",
            },
            {
              name: "Get EBOM By Id",
              category: "ebom",
              url: "https://skyronerp.onrender.com/api/bom/${id}",
              method: "GET",
              payload: "N/A",
              response:
                '{"bom": {"_id": "object id", "type": "type of EBOM", "name": "name of EBOM", "revision": "Revision Number", "partNumber": "EBOM part Number", "description": "EBOM Description", "quantityRequired": Number, "stockLevel": Number, "supplierInfo": "Supplier Info", "partWeight": "weight in kg", "uom": "unit of measure", "manufacturingInfo": "manufacturing Info", "inventoryLocation": "inventory Location", "createdAt": "created date", "updatedAt": "updated date", "__v": 0}}',
              status: "Active",
            },
            {
              name: "Update EBOM By Id",
              category: "ebom",
              url: "https://skyronerp.onrender.com/api/bom/${id}",
              method: "PUT",
              payload: '{"---update EBOM data---"}',
              response:
                '{"success": true, "message": "BOM updated successfully.", "bom": {"_id": "object id", "type": "type of EBOM", "name": "name of EBOM", "revision": "Revision Number", "partNumber": "EBOM part Number", "description": "EBOM Description", "quantityRequired": Number, "stockLevel": Number, "supplierInfo": "Supplier Info", "partWeight": "weight in kg", "uom": "unit of measure", "manufacturingInfo": "manufacturing Info", "inventoryLocation": "inventory Location", "createdAt": "created date", "updatedAt": "updated date", "__v": 0}}',
              status: "Active",
            },
            {
              name: "Delete EBOM By Id",
              category: "ebom",
              url: "https://skyronerp.onrender.com/api/bom/${id}",
              method: "DELETE",
              payload: "N/A",
              response: '{"success": true, "message": "BOM deleted successfully"}',
              status: "Active",
            },
            {
              name: "Create Document",
              category: "document",
              url: "https://skyronerp.onrender.com/api/documents/create",
              method: "POST",
              payload:
                '{"name": "Product Manual", "description": "This is the product manual for the ABC product.", "fileUrl": ""https://example.com/files/product-manual.pdf"}',
              response:
                '{"success": true, "message": "Document created successfully.", "newDocument": {"name": "Document Name", "description": "Document Description", "fileUrl": "Document url", "_id": "67e52f36dd34161b978210cb", "createdAt": "2025-03-27T10:57:58.295Z", "__v": 0}}',
              status: "Active",
            },
            {
              name: "Get All Documents",
              category: "document",
              url: "https://skyronerp.onrender.com/api/documents/",
              method: "GET",
              payload: "N/A",
              response:
                '{"documents": [{"_id": "Object Id", "name": "Document Name", "description": "Document Description", "fileUrl": "Document url", "_id": "67e52f36dd34161b978210cb", "createdAt": "2025-03-27T10:57:58.295Z", "__v": 0}]}',
              status: "Active",
            },
            {
              name: "Get Document By Id",
              category: "document",
              url: "https://skyronerp.onrender.com/api/documents/${id}",
              method: "GET",
              payload: "N/A",
              response:
                '{"document": {"_id": "Object Id", "name": "Document Name", "description": "Document Description", "fileUrl": "Document url", "_id": "67e52f36dd34161b978210cb", "createdAt": "2025-03-27T10:57:58.295Z", "__v": 0}}',
              status: "Active",
            },
            {
              name: "Update Document By Id",
              category: "document",
              url: "https://skyronerp.onrender.com/api/documents/${id}",
              method: "PUT",
              payload: '{"--document update changes----"}',
              response:
                '{"success": true, "message": "Document updated successfully.", "document": {"_id": "Object Id", "name": "Document Name", "description": "Document Description", "fileUrl": "Document url", "_id": "67e52f36dd34161b978210cb", "createdAt": "2025-03-27T10:57:58.295Z", "__v": 0}}',
              status: "Active",
            },
            {
              name: "Delete Document By Id",
              category: "document",
              url: "https://skyronerp.onrender.com/api/documents/${id}",
              method: "DELETE",
              payload: "N/A",
              response: '{"success": true, "message": "Document deleted successfully"}',
              status: "Active",
            },
          ],
        }

        setApiData(apiData.apis)
      } catch (err) {
        console.error("Error loading API data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadApiData()
  }, [router])

  const filterCategory = (category: string) => {
    if (activeCategory === category) {
      setActiveCategory(null)
      setFilteredApis([])
    } else {
      setActiveCategory(category)
      const filtered = apiData.filter((api) => api.category === category)
      setFilteredApis(filtered)
    }
  }

  const toggleApiDetails = (index: number) => {
    setExpandedApis((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      description: "Copied to clipboard",
    })
  }

  // Group APIs by category
  const categories = apiData.reduce<ApiCategories>((acc, api) => {
    if (!acc[api.category]) {
      acc[api.category] = []
    }
    acc[api.category].push(api)
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">APIs</h1>
        <p className="mb-6 text-sm text-gray-600">
          Pass the token on Authorization bearer Token and the token will be generated after login
        </p>

        {loading ? (
          <div className="text-center py-8">Loading API data...</div>
        ) : (
          <>
            {/* Category Cards */}
            <div className="flex flex-wrap gap-4 mb-8">
              {Object.keys(categories).map((category) => (
                <div
                  key={category}
                  className="category-card p-4 rounded-lg cursor-pointer"
                  onClick={() => filterCategory(category)}
                >
                  <h3 className="font-medium">{category.charAt(0).toUpperCase() + category.slice(1)} APIs</h3>
                </div>
              ))}
            </div>

            {/* API Cards */}
            {activeCategory && (
              <div className="space-y-4">
                {filteredApis.map((api, index) => (
                  <div
                    key={index}
                    className="api-card"
                    style={{ borderLeftColor: api.status === "Active" ? "#28a745" : "#dc3545" }}
                  >
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleApiDetails(index)}
                    >
                      <h3 className="text-blue-600 font-medium">{api.name}</h3>
                      <span className={`status ${api.status.toLowerCase()} px-2 py-1 rounded text-xs`}>
                        {api.status}
                      </span>
                    </div>

                    {expandedApis[index] && (
                      <div className="mt-4 space-y-3">
                        <p>
                          <strong>URL:</strong>{" "}
                          <a
                            href={api.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {api.url}
                          </a>
                        </p>
                        <p>
                          <strong>Method:</strong>{" "}
                          <span className={`method ${api.method} px-2 py-1 rounded text-xs`}>{api.method}</span>
                        </p>
                        <div>
                          <p>
                            <strong>Request Payload:</strong>
                          </p>
                          <div className="relative bg-gray-100 p-3 rounded font-mono text-sm whitespace-pre-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => copyText(api.payload || "N/A")}
                            >
                              <Clipboard className="h-4 w-4" />
                              <span className="sr-only">Copy</span>
                            </Button>
                            {api.payload ? api.payload : "N/A"}
                          </div>
                        </div>
                        <div>
                          <p>
                            <strong>Response Example:</strong>
                          </p>
                          <div className="relative bg-gray-100 p-3 rounded font-mono text-sm whitespace-pre-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => copyText(api.response)}
                            >
                              <Clipboard className="h-4 w-4" />
                              <span className="sr-only">Copy</span>
                            </Button>
                            {api.response}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

