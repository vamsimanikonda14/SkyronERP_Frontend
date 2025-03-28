// Helper functions for authentication

// Check if user is authenticated
export function isAuthenticated() {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("authToken")
  }
  return false
}

// Get the authentication token
export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken")
  }
  return null
}

// Get the current user
export function getCurrentUser() {
  if (typeof window !== "undefined") {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch (err) {
        console.error("Error parsing user data:", err)
      }
    }
  }
  return null
}

// Set authentication data
export function setAuthData(token: string, user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token)
    localStorage.setItem("user", JSON.stringify(user))
  }
}

// Clear authentication data
export function clearAuthData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
  }
}

