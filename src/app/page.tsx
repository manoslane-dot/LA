import Link from "next/link";
import {
  Check,
  Leaf,
  MapPin,
  Sprout,
  Star,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfaf5] text-[#173b2a]">
      <section className="relative isolate min-h-[720px] overflow-hidden bg-[#143c2b] text-white sm:min-h-[760px]">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=2400&q=90')",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-[#102d20]/70" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-[#0d261b]/75 to-transparent" />

        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-wide">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e9a83a] text-[#173b2a]">
              <Sprout size={22} strokeWidth={2.5} />
            </span>
            <span className="text-xl">AgroDirect</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-white/90 md:flex">
            <Link href="/" className="transition hover:text-[#ffd47d]">Αρχική</Link>
            <a href="#products" className="transition hover:text-[#ffd47d]">Προϊόντα</a>
            <a href="#about" className="transition hover:text-[#ffd47d]">Σχετικά με εμάς</a>
            <a href="#contact" className="transition hover:text-[#ffd47d]">Επικοινωνία</a>
          </div>
          <Link
            href="/auth/role"
            className="hidden rounded-md border border-white/40 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-[#173b2a] sm:block"
          >
            Είσοδος
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold sm:gap-3 md:hidden">
            <a href="#products" className="transition hover:text-[#ffd47d]">Προϊόντα</a>
            <a href="#about" className="transition hover:text-[#ffd47d]">Σχετικά</a>
            <Link href="/auth/role" className="rounded-md border border-white/40 px-2.5 py-1.5 transition hover:bg-white hover:text-[#173b2a]">Είσοδος</Link>
          </div>
        </nav>

        <div className="mx-auto flex max-w-7xl flex-col px-5 pb-16 pt-24 sm:px-8 sm:pt-28 lg:px-10 lg:pt-36">
          <div className="max-w-3xl">
            <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold backdrop-blur-sm">
              <MapPin size={16} className="text-[#ffd47d]" />
              Από την ελληνική γη, απευθείας σε εσάς
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.03] tracking-normal sm:text-6xl lg:text-7xl">
              Απευθείας από τον παραγωγό στο τραπέζι σας.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85 sm:text-xl">
              Ανακαλύψτε φρέσκα, τοπικά προϊόντα κορυφαίας ποιότητας. Στηρίζετε τους ανθρώπους της γης και απολαμβάνετε αυθεντική γεύση χωρίς μεσάζοντες.
            </p>
            <div className="mt-9">
              <Link
                href="/auth/role"
                className="inline-flex items-center justify-center rounded-md bg-[#e9a83a] px-6 py-4 font-bold text-[#173b2a] transition hover:bg-[#f5bd5c]"
              >
                Είσοδος στην πλατφόρμα
              </Link>
            </div>
          </div>

          <div className="mt-14 flex w-fit items-center gap-3 rounded-md border border-white/20 bg-[#143c2b]/60 px-4 py-3 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {['Μ', 'Γ', 'Ε', 'Κ'].map((initial, index) => (
                <span key={initial} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#143c2b] text-xs font-bold ${['bg-[#d97746]', 'bg-[#78a08c]', 'bg-[#cf8f51]', 'bg-[#b8605f]'][index]}`}>
                  {initial}
                </span>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 text-[#ffd47d]">
                {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={14} fill="currentColor" />)}
              </div>
              <p className="mt-0.5 text-xs font-medium text-white/90">4.9/5 από 500+ καταναλωτές και αγρότες</p>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="border-b border-[#dfe7dd] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#587b44]">Η επιλογή σας έχει αξία</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-[#173b2a] sm:text-4xl">Πιο κοντά στην πηγή. Πιο κοντά στη γεύση.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#547060]">Κάθε προϊόν συνδέεται με τον άνθρωπο που το καλλιέργησε. Επιλέξτε με διαφάνεια, γνωρίστε την προέλευση και παραγγείλετε με σιγουριά.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Leaf, title: 'Φρεσκάδα που φαίνεται', text: 'Τοπικά προϊόντα που φτάνουν σε εσάς με τη φυσική τους αξία.', color: 'bg-[#e9f0d9]' },
              { icon: MapPin, title: 'Γνωστή προέλευση', text: 'Δείτε ποιος παράγει, πού καλλιεργεί και τι επιλέγετε.', color: 'bg-[#dcece2]' },
              { icon: Check, title: 'Δίκαιη αγορά', text: 'Περισσότερη αξία για τον παραγωγό, καθαρή τιμή για εσάς.', color: 'bg-[#f9e8c6]' },
            ].map(({ icon: Icon, title, text, color }) => (
              <article key={title} className="border border-[#e2e9df] bg-[#fdfdfb] p-6">
                <span className={`grid h-11 w-11 place-items-center rounded-full ${color} text-[#285437]}`}><Icon size={21} /></span>
                <h3 className="mt-5 text-xl font-bold text-[#173b2a]">{title}</h3>
                <p className="mt-2 leading-7 text-[#5b7465]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#e9f0d9] py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10">
          <div className="relative min-h-[360px] overflow-hidden sm:min-h-[460px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=85')" }}
            />
            <div className="absolute bottom-5 left-5 bg-[#173b2a] px-5 py-4 text-white">
              <p className="text-3xl font-bold text-[#ffd47d]">100%</p>
              <p className="mt-1 text-sm font-medium">πιο ανθρώπινη αγορά</p>
            </div>
          </div>
          <div className="max-w-xl lg:pl-8">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#587b44]">Για ανθρώπους της γης και της πόλης</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#173b2a] sm:text-4xl">Η καλή τροφή αξίζει μια καθαρή διαδρομή.</h2>
            <p className="mt-5 leading-8 text-[#496554]">Το AgroDirect φέρνει σε άμεση επαφή παραγωγούς και καταναλωτές. Χτίζουμε μια αγορά όπου η ποιότητα, η εμπιστοσύνη και ο σεβασμός στην εργασία της γης έχουν τον πρώτο λόγο.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf5] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#587b44]">Μια αγορά που σέβεται τη γη</p>
            <h2 className="mt-3 text-3xl font-bold text-[#173b2a] sm:text-4xl">Απλή, καθαρή και άμεση επικοινωνία από την πρώτη στιγμή.</h2>
            <p className="mt-5 leading-8 text-[#496554]">
              Από την επιλογή του προϊόντος μέχρι την παραλαβή, το AgroDirect κρατά τη σχέση παραγωγού και καταναλωτή ξεκάθαρη, αξιόπιστη και κοντά στην πραγματική αξία της τροφής.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              { title: 'Άμεση επικοινωνία', text: 'Συνδέεστε με τον παραγωγό και διατηρείτε σαφή κανάλι επικοινωνίας πριν και μετά την παραγγελία.' },
              { title: 'Διαφάνεια τιμών', text: 'Βλέπετε καθαρά την ποσότητα, την τιμή και την προέλευση του προϊόντος που επιλέγετε.' },
              { title: 'Αξιόπιστη παρακολούθηση', text: 'Παρακολουθείτε την κατάσταση της παραγγελίας με τρόπο απλό και κατανοητό.' },
            ].map(({ title, text }) => (
              <article key={title} className="border border-[#e1e7dd] bg-white p-6 sm:p-7">
                <h3 className="text-xl font-bold text-[#173b2a]">{title}</h3>
                <p className="mt-3 leading-7 text-[#5b7465]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#173b2a] py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div><h2 className="text-3xl font-bold">Η επόμενη καλή αγορά ξεκινά εδώ.</h2><p className="mt-2 text-white/75">Μπείτε στην κοινότητα του AgroDirect σήμερα.</p></div>
        </div>
      </section>

      <footer className="bg-[#102d20] py-6 text-sm text-white/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 sm:flex-row sm:justify-between sm:px-8 lg:px-10"><p>AgroDirect © 2026. Ελληνική γη, άμεση αξία.</p></div>
      </footer>
    </main>
  );
}
