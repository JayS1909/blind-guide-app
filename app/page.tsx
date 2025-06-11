"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Head from "next/head"

declare global {
  interface Window {
    L: any
    firebase: any
  }
}

export default function BlindNavigationDashboard() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [voiceMessage, setVoiceMessage] = useState("")
  const [emergencyAlert, setEmergencyAlert] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting")

  useEffect(() => {
    // Load external scripts sequentially
    const loadScripts = async () => {
      try {
        // Load Leaflet CSS first
        const leafletCSS = document.createElement("link")
        leafletCSS.rel = "stylesheet"
        leafletCSS.href = "https://unpkg.com/leaflet/dist/leaflet.css"
        document.head.appendChild(leafletCSS)

        // Load Firebase App script first and wait for it
        await loadScript("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js")

        // Wait a bit to ensure Firebase app is fully initialized
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Load Firebase Database script after app is ready
        await loadScript("https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js")

        // Load Leaflet script
        await loadScript("https://unpkg.com/leaflet/dist/leaflet.js")

        // Initialize the application
        initializeApp()
      } catch (error) {
        console.error("Error loading scripts:", error)
        setIsLoading(false)
        setConnectionStatus("error")
      }
    }

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve()
          return
        }

        const script = document.createElement("script")
        script.src = src
        script.async = true

        script.onload = () => {
          console.log(`Loaded: ${src}`)
          resolve()
        }

        script.onerror = () => {
          console.error(`Failed to load: ${src}`)
          reject(new Error(`Failed to load script: ${src}`))
        }

        document.head.appendChild(script)
      })
    }

    const initializeApp = () => {
      try {
        setConnectionStatus("connecting")

        // Check if Firebase is available
        if (!window.firebase) {
          console.error("Firebase not loaded")
          setConnectionStatus("error")
          setIsLoading(false)
          return
        }

        // Firebase config
        const firebaseConfig = {
          apiKey: "AIzaSyCiBewL3q6fMOyQY--TacGbDkte41bOLG0",
          authDomain: "blindguidesystem.firebaseapp.com",
          databaseURL: "https://blindguidesystem-default-rtdb.firebaseio.com",
          projectId: "blindguidesystem",
          storageBucket: "blindguidesystem.appspot.com",
          messagingSenderId: "591764650022",
          appId: "1:591764650022:web:bc5e808a7033b8e88f4ee7",
        }

        // Initialize Firebase
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(firebaseConfig)
        }

        const db = window.firebase.database()

        // Test connection
        db.ref(".info/connected").on("value", (snapshot: any) => {
          if (snapshot.val() === true) {
            setConnectionStatus("connected")
          } else {
            setConnectionStatus("error")
          }
        })

        // Initialize Leaflet Map
        if (mapRef.current && window.L) {
          const mapInstance = window.L.map(mapRef.current).setView([20.5937, 78.9629], 5)
          window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: "© OpenStreetMap contributors",
          }).addTo(mapInstance)

          setMap(mapInstance)

          // Listen for location updates
          db.ref("location").on("value", (snapshot: any) => {
            try {
              const loc = snapshot.val()
              if (loc && loc.lat && loc.lon) {
                const newPos = [loc.lat, loc.lon]
                if (!marker) {
                  const newMarker = window.L.marker(newPos).addTo(mapInstance)
                  setMarker(newMarker)
                } else {
                  marker.setLatLng(newPos)
                }
                mapInstance.setView(newPos, 16)
              }
            } catch (error) {
              console.error("Error handling location update:", error)
            }
          })

          // Listen for emergency alerts
          db.ref("emergency").on("value", (snapshot: any) => {
            try {
              const alert = snapshot.val()
              if (alert && alert.alert) {
                setEmergencyAlert("🚨 " + alert.alert)
                db.ref("emergency").remove()
                // Auto-clear alert after 10 seconds
                setTimeout(() => setEmergencyAlert(""), 10000)
              }
            } catch (error) {
              console.error("Error handling emergency alert:", error)
            }
          })
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing app:", error)
        setConnectionStatus("error")
        setIsLoading(false)
      }
    }

    loadScripts()

    // Cleanup function
    return () => {
      if (window.firebase && window.firebase.apps.length) {
        try {
          const db = window.firebase.database()
          db.ref("location").off()
          db.ref("emergency").off()
        } catch (error) {
          console.error("Error during cleanup:", error)
        }
      }
    }
  }, [])

  const sendVoice = () => {
    if (voiceMessage.trim() !== "") {
      try {
        if (!window.firebase) {
          alert("❌ Firebase not initialized. Please refresh the page.")
          return
        }

        const db = window.firebase.database()
        db.ref("voice")
          .set(voiceMessage)
          .then(() => {
            alert("✅ Message sent.")
            setVoiceMessage("")
          })
          .catch((error: any) => {
            console.error("Error sending message:", error)
            alert("❌ Failed to send message. Please try again.")
          })
      } catch (error) {
        console.error("Error in sendVoice:", error)
        alert("❌ An error occurred. Please refresh the page.")
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      sendVoice()
    }
  }

  return (
    <>
      <Head>
        <title>Blind Navigation Dashboard</title>
        <meta name="description" content="Accessible navigation dashboard for blind users" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-900 text-white shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-center">Blind Person Navigation Guide</h1>
            <p className="text-blue-100 text-center mt-2 text-sm md:text-base">
              Real-time location tracking and communication system
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-8">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg">Loading dashboard...</span>
            </div>
          )}

          {/* Connection Status */}
          {!isLoading && (
            <section className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-500"
                      : connectionStatus === "connecting"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {connectionStatus === "connected"
                    ? "Connected to Firebase"
                    : connectionStatus === "connecting"
                      ? "Connecting..."
                      : "Connection Error"}
                </span>
              </div>
            </section>
          )}

          {/* Emergency Alert */}
          {emergencyAlert && (
            <section
              className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg shadow-md"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-red-800">Emergency Alert</h2>
                  <p className="text-red-700 text-lg font-medium">{emergencyAlert}</p>
                </div>
              </div>
            </section>
          )}

          {/* Map Section */}
          <section className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Live Location Tracking</h2>
              <p className="text-gray-600 text-sm mt-1">Real-time GPS location display</p>
            </div>
            <div className="p-6">
              <div
                ref={mapRef}
                className="w-full h-64 md:h-96 rounded-lg border-2 border-gray-200"
                role="img"
                aria-label="Interactive map showing current location"
              />
            </div>
          </section>

          {/* Voice Message Section */}
          <section className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Send Voice Message</h2>
              <p className="text-gray-600 text-sm mt-1">Communicate with your guide or emergency contacts</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <label htmlFor="voiceText" className="sr-only">
                  Voice message content
                </label>
                <textarea
                  id="voiceText"
                  value={voiceMessage}
                  onChange={(e) => setVoiceMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none"
                  placeholder="Type your message here... (Press Ctrl+Enter to send)"
                  aria-describedby="message-help"
                />
                <p id="message-help" className="text-sm text-gray-500">
                  Use this field to send messages to your guide or emergency contacts. Press Ctrl+Enter to send quickly.
                </p>
                <button
                  onClick={sendVoice}
                  disabled={!voiceMessage.trim()}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
                  aria-describedby="send-help"
                >
                  Send Message
                </button>
                <p id="send-help" className="text-sm text-gray-500">
                  Click to send your message to connected guides and emergency contacts.
                </p>
              </div>
            </div>
          </section>

          {/* Accessibility Features Info */}
          <section className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">Accessibility Features</h2>
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Screen reader optimized with proper ARIA labels</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>High contrast colors for better visibility</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Large touch targets for easy navigation</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Keyboard shortcuts: Ctrl+Enter to send messages</span>
              </li>
            </ul>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-300">© 2024 Blind Navigation Guide - Empowering independence through technology</p>
          </div>
        </footer>
      </div>
    </>
  )
}
