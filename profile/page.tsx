"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import DashboardLayout from "@/components/dashboard-layout"

interface UserProfile {
  fullname: string
  email: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({ fullname: "", email: "" })
  const [password, setPassword] = useState("******")
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setProfile({
          fullname: user.fullname || "",
          email: user.email || "",
        })
        setLoading(false)
      } catch (err) {
        console.error("Error parsing user data:", err)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user profile from localStorage",
        })
        setLoading(false)
      }
    } else {
      fetchUserProfile(token)
    }
  }, [router, toast])

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch("https://skyronerp.onrender.com/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user profile")
      }

      const contentType = response.headers.get("Content-Type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON")
      }

      const data = await response.json()
      if (data.user) {
        setProfile({
          fullname: data.user.fullname || "",
          email: data.user.email || "",
        })
      }
    } catch (err) {
      console.error("Error fetching user profile:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user profile",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/")
      return
    }

    const userId = localStorage.getItem("userId") // Assuming user ID is saved in localStorage

    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found",
      })
      return
    }

    try {
      const updatedData = {
        fullname: profile.fullname,
        password: password === "******" ? undefined : password,
      }

      const response = await fetch(`https://skyronerp.onrender.com/api/auth/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const contentType = response.headers.get("Content-Type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON")
      }

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })

        // Update user data in localStorage
        const userData = localStorage.getItem("user")
        if (userData) {
          const user = JSON.parse(userData)
          user.fullname = profile.fullname
          localStorage.setItem("user", JSON.stringify(user))
        }

        setIsEditing(false)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile",
        })
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating your profile",
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setPassword("******")
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setProfile({
        fullname: user.fullname || "",
        email: user.email || "",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">User Profile</h2>

        {loading ? (
          <div className="text-center py-8">Loading profile...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name:</Label>
              <Input
                id="fullname"
                name="fullname"
                value={profile.fullname}
                onChange={(e) => setProfile({ ...profile, fullname: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email:</Label>
              <Input id="email" name="email" type="email" value={profile.email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password:</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="flex gap-4">
              {!isEditing ? (
                <Button type="button" onClick={handleEdit}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
