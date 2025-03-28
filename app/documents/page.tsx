"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"

interface Document {
  name: string
  description: string
  fileUrl: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    // Fetch documents
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

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Documents</h2>

        {loading ? (
          <div className="text-center py-8">Loading documents...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Name</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">Description</th>
                  <th className="bg-[#f79c34] text-white p-3 text-left">File URL</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      No documents found
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="border-b p-3">{doc.name}</td>
                      <td className="border-b p-3">{doc.description}</td>
                      <td className="border-b p-3">{doc.fileUrl}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

