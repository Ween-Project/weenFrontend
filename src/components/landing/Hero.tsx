import Link from "next/link";
export function Hero() {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid min-h-[720px] w-full max-w-[1440px] grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-12 lg:px-[120px]">
          <div className="lg:col-span-6">
            <h1 className="max-w-[560px] text-[44px] font-extrabold leading-[1.12] text-[#1F2937] md:text-[56px]">
              Empowering students to change the world
            </h1>

            <p className="mt-6 max-w-[520px] text-[16px] leading-[1.7] text-[#6B7280]">
              Discover meaningful volunteering opportunities tailored to your
              skills. Track your impact, build your resume, and join a global
              community of young change-makers.
            </p>

            <div className="mt-10 flex flex-col gap-5 sm:flex-row">
               <Link
                href="/login"
                className="flex h-[56px] items-center justify-center rounded-[6px] bg-[#26DE81] px-12 text-[16px] font-bold text-white"
              >
                Get Started
              </Link>
              
              <Link href="/login?message=Sign%20in%20to%20explore%20events." className="flex h-[56px] items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-12 text-[16px] font-bold text-[#1F2937]">
                Explore Events
              </Link>
            </div>

            <div className="mt-12 grid max-w-[560px] grid-cols-3 border-t border-[#E5E7EB] pt-8">
              {["500+", "10k+", "250k+"].map((item, index) => (
                <div key={item}>
                  <h3 className="text-[28px] font-extrabold text-[#078847]">
                    {item}
                  </h3>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {index === 0
                      ? "Events Weekly"
                      : index === 1
                      ? "Volunteers"
                      : "Impact Hours"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:col-span-6 lg:justify-end">
            <img
              src="/images/Hero-image.png"
              alt="Students volunteering"
              className="w-full max-w-[600px] object-contain"
            />
          </div>
        </div>
      </section>
    </>
  );
}
