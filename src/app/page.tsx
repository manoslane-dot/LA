import Link from "next/link";
import {
  ArrowRight,
  Check,
  Leaf,
  MapPin,
  ShoppingBasket,
  Sprout,
  Star,
  Tractor,
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
            href="/auth"
            className="hidden rounded-md border border-white/40 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-[#173b2a] sm:block"
          >
            Σύνδεση
          </Link>
          <div className="flex items-center gap-3 text-xs font-semibold sm:gap-4 md:hidden">
            <a href="#products" className="transition hover:text-[#ffd47d]">Προϊόντα</a>
            <a href="#about" className="transition hover:text-[#ffd47d]">Σχετικά</a>
            <Link href="/auth" className="rounded-md border border-white/40 px-2.5 py-1.5 transition hover:bg-white hover:text-[#173b2a]">Σύνδεση</Link>
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
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/consumer/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#e9a83a] px-6 py-4 font-bold text-[#173b2a] transition hover:bg-[#f5bd5c]"
              >
                <ShoppingBasket size={19} />
                Ανακαλύψτε τα προϊόντα
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/50 bg-white/10 px-6 py-4 font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#173b2a]"
              >
                <Tractor size={20} />
                Σύνδεση αγρότη
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
            <Link href="/auth" className="mt-7 inline-flex items-center gap-2 font-bold text-[#285437] transition hover:text-[#6b8d40]">
              Γίνετε συνεργάτης <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf5] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#587b44]">Αληθινές εμπειρίες</p>
            <h2 className="mt-3 text-3xl font-bold text-[#173b2a] sm:text-4xl">Η εμπιστοσύνη μεγαλώνει μαζί μας.</h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              { initials: 'ΓΠ', name: 'Γιώργος Π.', role: 'Καταναλωτής, Αθήνα', quote: 'Σαν να πήρα τα λαχανικά από το χωριό. Ξέρω ποιος τα καλλιέργησε και η διαφορά στη γεύση είναι απίστευτη.', tone: 'bg-[#dcece2]' },
              { initials: 'ΔΚ', name: 'Δημήτρης Κ.', role: 'Παραγωγός ελαιολάδου, Μεσσηνία', quote: 'Βρήκα ανθρώπους που εκτιμούν τη δουλειά μου και διαθέτω την παραγωγή μου με τρόπο τίμιο και απλό.', tone: 'bg-[#f9e8c6]' },
              { initials: 'ΕΜ', name: 'Ελένη Μ.', role: 'Καταναλώτρια, Θεσσαλονίκη', quote: 'Η παραγγελία ήταν εύκολη και το μέλι έφτασε την επόμενη μέρα, ακριβώς όπως το υποσχέθηκε ο παραγωγός.', tone: 'bg-[#e8dfcf]' },
            ].map(({ initials, name, role, quote, tone }) => (
              <article key={name} className="border border-[#e1e7dd] bg-white p-6 sm:p-7">
                <div className="flex gap-1 text-[#e09a21]">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} fill="currentColor" />)}</div>
                <blockquote className="mt-5 text-lg leading-8 text-[#355746]">“{quote}”</blockquote>
                <div className="mt-7 flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-[#173b2a] ${tone}`}>{initials}</span>
                  <div><p className="font-bold text-[#173b2a]">{name}</p><p className="text-sm text-[#668070]">{role}</p></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#173b2a] py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div><h2 className="text-3xl font-bold">Η επόμενη καλή αγορά ξεκινά εδώ.</h2><p className="mt-2 text-white/75">Μπείτε στην κοινότητα του AgroDirect σήμερα.</p></div>
          <Link href="/consumer/dashboard" className="inline-flex w-fit items-center gap-2 rounded-md bg-[#e9a83a] px-5 py-3.5 font-bold text-[#173b2a] transition hover:bg-[#f5bd5c]">Δείτε τα προϊόντα <ArrowRight size={18} /></Link>
        </div>
      </section>

      <footer className="bg-[#102d20] py-6 text-sm text-white/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 sm:flex-row sm:justify-between sm:px-8 lg:px-10"><p>AgroDirect © 2026. Ελληνική γη, άμεση αξία.</p><Link href="/auth" className="transition hover:text-white">Σύνδεση συνεργάτη</Link></div>
      </footer>
    </main>
  );
}
