import Link from "next/link";
export function CTA() {
  return (
    <>
      <section className="bg-[#F8FAFC] py-24">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-16 px-6 lg:grid-cols-12 lg:px-[120px]">
          <div className="lg:col-span-6">
            <h2 className="text-[40px] font-extrabold leading-tight text-[#1F2937]">
              Your Impact, Documented.
            </h2>

            <p className="mt-5 max-w-[560px] text-[16px] leading-[1.7] text-[#6B7280]">
              Stop losing track of your volunteer hours. Ween creates a dynamic,
              verifiable profile that showcases your dedication to social good
              with beautiful badges and certified transcripts.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                "Automated hour tracking and verification",
                "Skill-based achievement badges",
                "Direct export for college applications",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-[15px] font-medium text-[#1F2937]"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#078847] text-[12px] font-bold text-[#078847]">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center lg:col-span-6 lg:justify-end">
            <div className="w-full max-w-[430px] overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-2xl shadow-gray-300/60">
              <div className="h-2 bg-[#078847]" />

              <div className="p-7">
                <div className="flex items-center gap-4">
                  <img
                    src="/images/profile.png"
                    alt="Alex Johnson"
                    className="h-14 w-14 rounded-full border-2 border-[#26DE81] object-cover"
                  />

                  <div>
                    <h3 className="text-[22px] font-extrabold text-[#1F2937]">
                      Alex Johnson
                    </h3>
                    <p className="text-[13px] font-medium text-[#6B7280]">
                      Class of 2025 • Impact Pioneer
                    </p>
                  </div>
                </div>

                <div className="mt-7 rounded-[8px] border border-[#E5E7EB] p-5">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#6B7280]">
                    Total Impact
                  </p>

                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-[36px] font-extrabold leading-none text-[#078847]">
                      120
                    </span>
                    <span className="pb-1 text-[16px] font-bold text-[#1F2937]">
                      Verified Hours
                    </span>
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div className="h-full w-[75%] rounded-full bg-[#078847]" />
                  </div>

                  <p className="mt-2 text-[11px] font-bold text-[#6B7280]">
                    75% to Platinum Milestone
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[#D1FAE5] px-4 py-2 text-[12px] font-bold text-[#078847]">
                    Social Leader
                  </span>

                  <span className="rounded-full bg-[#FFE4D6] px-4 py-2 text-[12px] font-bold text-[#E8551B]">
                    Sustainability Pro
                  </span>
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-[#E5E7EB] pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#E5E7EB] text-[#6B7280]">
                      📄
                    </div>

                    <p className="text-[13px] font-medium text-[#1F2937]">
                      Official Impact Record.pdf
                    </p>
                  </div>

                  <button className="text-[18px] text-[#6B7280]">↓</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 lg:px-[120px]">
        <div className="mx-auto max-w-[1200px] rounded-[32px] bg-[#078847] px-6 py-16 text-center md:px-12">
          <h2 className="mx-auto max-w-[760px] text-[36px] font-extrabold leading-tight text-white md:text-[48px]">
            Start Your Volunteer Journey Today
          </h2>

          <p className="mx-auto mt-5 max-w-[720px] text-[18px] font-medium leading-[1.6] text-white/80">
            Join thousands of students and organizations making a measurable
            difference in their communities.
          </p>

          <div className="mt-10 flex justify-center">
            <Link
              href="/login"
              className="flex h-[58px] w-full max-w-[600px] items-center justify-center rounded-[8px] bg-white px-8 text-[15px] font-extrabold text-[#078847] transition hover:bg-[#F8FAFC]"
            >
              Create Volunteer Account
            </Link>
          </div>


        </div>
      </section>

      <footer className="border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-[120px]">
          <div>
            <h3 className="text-[18px] font-extrabold text-[#1F2937]">Ween</h3>

            <p className="mt-3 max-w-[300px] text-[13px] leading-[1.6] text-[#6B7280]">
              © 2026 Ween. Empowering the next generation of social
              contributors.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] font-medium text-[#6B7280]">
            <a>Privacy Policy</a>
            <a>Terms of Service</a>
            <a>Cookie Policy</a>
            <a>Contact Us</a>
          </div>
        </div>
      </footer>
    </>
  );
}