import { type NextRequest, NextResponse } from "next/server"

// Mock user data
const users = [
  {
    _id: "1",
    email: "user@example.com",
    password: "password123", // In a real app, this would be hashed
    fullname: "John Doe",
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Find user
    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    // In a real app, you would generate a JWT token here
    const token = "mock-jwt-token"

    // Return user data and token
    return NextResponse.json({
      success: true,
      message: "Login Successful",
      user: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname,
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

