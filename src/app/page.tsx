import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl bg-white p-8 rounded-2xl shadow-lg border border-green-100">
        <h1 className="text-4xl font-extrabold text-green-800 mb-4">🌾 AgroDirect</h1>
        <p className="text-gray-600 mb-8">
          Η άμεση σύνδεση αγροτών και καταναλωτών για φρέσκα προϊόντα χωρίς μεσάζοντες.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link
            href="/farmer/dashboard"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow transition duration-200"
          >
            👨‍🌾 Είσοδος Παραγωγού
          </Link>
          <Link
            href="/consumer/dashboard"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-6 rounded-xl shadow transition duration-200"
          >
            🛒 Είσοδος Καταναλωτή
          </Link>
        </div>

        <div>
          <Link
            href="/auth"
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
          >
            🔐 Σύνδεση / Εγγραφή Χρήστη
          </Link>
        </div>
      </div>
    </main>
  );
}
