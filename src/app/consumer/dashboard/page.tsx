"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ConsumerDashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
      }
    }
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-xl font-bold">Consumer Dashboard</h1>
          <button
            onClick={handleLogout}
            className="rounded bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
          >
            Αποσύνδεση
          </button>
        </div>
        <div className="mt-6">
          <p className="text-gray-700">
            Καλώς ήρθατε! Συνδεθήκατε ως: <span className="font-semibold">{userEmail ?? "Φόρτωση..."}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
