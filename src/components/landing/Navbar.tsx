import Link from "next/link";

export function Navbar() {
  return (
    <header className="w-full border-b border-[#E5E7EB] bg-white">
      <nav className="mx-auto flex h-[64px] w-full max-w-[1440px] items-center justify-between px-6 lg:px-[120px]">
        <div className="flex items-center gap-10">
          <Link href="/" className="text-[20px] font-extrabold text-[#078847]">
            Ween
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <Link
              href="/"
              className="border-b-2 border-[#26DE81] pb-[6px] text-[13px] font-semibold text-[#1F2937]"
            >
              About
            </Link>

            <Link
              href="/login?message=Sign%20in%20to%20explore%20events."
              className="pb-[6px] text-[13px] font-medium text-[#6B7280] transition hover:text-[#1F2937]"
            >
              Explore
            </Link>

            <Link
              href="/login?message=Sign%20in%20to%20view%20events."
              className="pb-[6px] text-[13px] font-medium text-[#6B7280] transition hover:text-[#1F2937]"
            >
              Events
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 lg:gap-7">
          <Link
            href="/register"
            className="hidden text-[13px] font-semibold text-[#1F2937] transition hover:text-[#26DE81] sm:block"
          >
            Log In
          </Link>

          <Link
            href="/login"
            className="rounded-[6px] bg-[#26DE81] px-6 py-3 text-[13px] font-bold text-white transition hover:bg-[#20c975]"
          >
            Create Account
          </Link>
        </div>
      </nav>
    </header>
  );
}
