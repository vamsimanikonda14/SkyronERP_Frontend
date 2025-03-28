"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Lock, User } from "lucide-react"
import "./LoginPage.css" // Make sure to import the CSS file

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("authToken")
    if (token) {
      router.push("/dashboard")
    }

    // Initialize particles.js
    if (typeof window !== "undefined" && window.particlesJS) {
      window.particlesJS("particles-js", {
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: "#ffffff",
          },
          shape: {
            type: "circle",
            stroke: {
              width: 0,
              color: "#000000",
            },
            polygon: {
              nb_sides: 5,
            },
          },
          opacity: {
            value: 0.5,
            random: false,
            anim: {
              enable: false,
              speed: 1,
              opacity_min: 0.1,
              sync: false,
            },
          },
          size: {
            value: 3,
            random: true,
            anim: {
              enable: false,
              speed: 40,
              size_min: 0.1,
              sync: false,
            },
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#ffffff",
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 6,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
              enable: false,
              rotateX: 600,
              rotateY: 1200,
            },
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: true,
              mode: "repulse",
            },
            onclick: {
              enable: true,
              mode: "push",
            },
            resize: true,
          },
        },
        retina_detect: true,
      })
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("https://skyronerp.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // Store the JWT token in localStorage
        localStorage.setItem("authToken", data.token)

        // Store the user data in localStorage
        localStorage.setItem("user", JSON.stringify(data.user))

        toast({
          title: "Login successful",
          description: "Redirecting to dashboard...",
        })

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: data.message || "Please check your credentials and try again.",
        })
      }
    } catch (error) {
      console.error("Error during login:", error)
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An error occurred. Please try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login min-h-screen">
      {/* Particle background effect */}
      <div id="particles-js"></div>

      <div className="container mx-auto px-4">
        <div className="login-container-wrapper">
          <div className="logo">
            <User className="w-12 h-12 text-white mx-auto" />
          </div><br/><br/>
          <div className="welcome">
            <strong>Skyron ERP</strong><br/>
            <strong>Welcome,</strong> please login
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                id="login_username"
                type="email"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-[rgba(40,52,67,0.75)] border-l-4 border-[#93a5ab] text-white h-12"
              />
              <User className="absolute left-3 top-3 h-5 w-5 text-[#93a5ab]" />
            </div>

            <div className="relative">
              <Input
                id="login_password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 bg-[rgba(40,52,67,0.75)] border-l-4 border-[#93a5ab] text-white h-12"
              />
              <Lock className="absolute left-3 top-3 h-5 w-5 text-[#93a5ab]" />
            </div>

            <Button
              type="submit"
              className="w-full bg-transparent border-2 border-[#93a5ab] hover:border-white hover:bg-[#7692A7] transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
