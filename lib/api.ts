// API helper functions

import { getToken } from "./auth"

const API_BASE_URL = "http://localhost:5000/api"

// Generic fetch function with authentication
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken()

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || "API request failed")
  }

  return response.json()
}

// API functions for authentication
export const authApi = {
  login: (email: string, password: string) =>
    fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () => fetchWithAuth("/auth/profile"),

  updateProfile: (data: any) =>
    fetchWithAuth("/auth/users", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

// API functions for documents
export const documentsApi = {
  getAll: () => fetchWithAuth("/documents/"),

  getById: (id: string) => fetchWithAuth(`/documents/${id}`),

  create: (data: any) =>
    fetchWithAuth("/documents/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchWithAuth(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth(`/documents/${id}`, {
      method: "DELETE",
    }),
}

// API functions for EBOM
export const ebomApi = {
  getAll: () => fetchWithAuth("/bom/"),

  getById: (id: string) => fetchWithAuth(`/bom/${id}`),

  create: (data: any) =>
    fetchWithAuth("/bom/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchWithAuth(`/bom/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchWithAuth(`/bom/${id}`, {
      method: "DELETE",
    }),
}

