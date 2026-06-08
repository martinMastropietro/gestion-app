"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { apiRequest } from "@/lib/api";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = window.localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
      return;
    }

    async function loadProfile() {
      try {
        const data = await apiRequest(`/user/${userId}`);
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar userProfile={profile} />
      <main style={{ 
        flex: 1, 
        padding: "32px", 
        maxWidth: "1400px", 
        margin: "0 auto",
        width: "100%"
      }}>
        {isLoading ? (
          <div style={{ 
            display: "grid", 
            placeItems: "center", 
            height: "60vh", 
            fontFamily: "Space Mono, monospace",
            color: "#2563eb"
          }}>
            Cargando sistema...
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
