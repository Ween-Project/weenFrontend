export function Features() {
  const features = [
    ["Discover", "Personalized feed of local and remote opportunities that match your interests and schedule."],
    ["Participate", "Apply with one click and join curated teams of like-minded students making a real difference."],
    ["Verify", "Get your hours instantly verified by organization leaders via secure QR codes."],
    ["Build Profile", "Export professional impact resumes and earn credentials that stand out on other applications."],
  ];

  return (
    <>
      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-[120px]">
          <div className="mx-auto max-w-[720px] text-center">
            <h2 className="text-[36px] font-extrabold text-[#1F2937]">
              What is Ween?
            </h2>
            <p className="mt-4 text-[16px] leading-[1.7] text-[#6B7280]">
              A comprehensive platform designed to streamline the student
              volunteering experience from discovery to verification.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map(([title, text], index) => (
              <div
                key={title}
                className="rounded-[8px] border border-[#E5E7EB] bg-white p-7"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-[8px] text-[20px] font-bold ${
                    index % 2 === 0
                      ? "bg-[#D1FAE5] text-[#078847]"
                      : "bg-[#FFE4D6] text-[#E8551B]"
                  }`}
                >
                  {index === 0 ? "⌕" : index === 1 ? "♟" : index === 2 ? "✓" : "▣"}
                </div>

                <h3 className="mt-6 text-[22px] font-extrabold text-[#1F2937]">
                  {title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.7] text-[#6B7280]">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC] py-24">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-16 px-6 lg:grid-cols-12 lg:px-[120px]">
          <div className="lg:col-span-6">
            <img
              src="/images/event-image.png"
              alt="Students volunteering"
              className="w-full rounded-[12px] object-cover"
            />
          </div>

          <div className="lg:col-span-6">
            <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#078847]">
              Featured Opportunity
            </p>
            <h2 className="mt-4 text-[36px] font-extrabold text-[#1F2937]">
              Lutfizade Scholarship
            </h2>
            <p className="mt-6 max-w-[520px] text-[16px] leading-[1.7] text-[#6B7280]">
              Join 200+ students and become part of the Scholarship Program.
              Take the next step in your journey with a program designed to
              support your growth and success.
            </p>

            <button className="mt-14 h-[60px] w-full max-w-[520px] rounded-[6px] bg-[#26DE81] text-[20px] font-bold text-white">
              Register for Event
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-[#E5E7EB] bg-white py-10">
        <p className="mb-8 text-center text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#6B7280]">
          Collaborating Organizations
        </p>

        <div className="relative overflow-hidden">
          <div className="flex w-max animate-logo-scroll items-center gap-16">
            <img
              src="/images/carousel-logos.png"
              alt="Collaborating organizations"
              className="h-[72px] w-auto object-contain"
            />
            <img
              src="/images/carousel-logos.png"
              alt="Collaborating organizations"
              className="h-[72px] w-auto object-contain"
            />
          </div>
        </div>
      </section>
    </>
  );
}