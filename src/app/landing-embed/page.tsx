export default function EmbeddedLandingPage() {
  return (
    <>
      <style>{`
        html, body {
          overflow-x: hidden !important;
          overflow-y: scroll !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: #ffffff;
          user-select: none;
        }
        
        /* Custom thin green scrollbar */
        ::-webkit-scrollbar {
          width: 5px !important;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02) !important;
        }
        ::-webkit-scrollbar-thumb {
          background: #26DE81 !important;
          border-radius: 10px !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #1fbe6d !important;
        }
      `}</style>

      <main className="min-h-[160vh] w-screen flex flex-col bg-white p-8 font-sans select-none cursor-default">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-6">
            <span className="text-lg font-black tracking-tight text-[#078847]">
              Ween
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#26DE81] animate-pulse"></span>
            <span className="text-xs font-bold text-gray-700">Platform Active</span>
          </div>
        </header>

        {/* Hero split section */}
        <div className="grid grid-cols-12 gap-8 items-center mt-8">
          {/* Left Hero Column */}
          <div className="col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center self-start bg-[#E8FBF2] px-2.5 py-1 rounded-full text-[9px] font-extrabold text-[#078847] uppercase tracking-wider">
              ✦ Student Volunteering Ecosystem
            </div>
            <h1 className="text-3xl font-black leading-tight text-gray-900 mt-3.5">
              Empowering students to change the world.
            </h1>
            <p className="text-xs leading-relaxed text-gray-500 mt-3">
              Discover volunteering opportunities tailored to your skills. Track your impact, export trusted portfolios, and connect with local NGOs.
            </p>
            
            {/* Informative pills instead of clickable login buttons */}
            <div className="flex flex-wrap gap-2 mt-5">
              <div className="h-7 px-4 bg-[#D1FAE5] text-[#078847] text-[10px] font-bold rounded-full flex items-center justify-center border border-[#A7F3D0]">
                ✓ 10,240 Volunteers Active
              </div>
              <div className="h-7 px-4 bg-[#ECEFF1] text-[#455A64] text-[10px] font-bold rounded-full flex items-center justify-center border border-gray-200">
                ★ 250k+ Impact Hours
              </div>
            </div>
          </div>

          {/* Right Dashboard Mock Card */}
          <div className="col-span-5">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-[0_6px_20px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-[10px] font-bold text-gray-800">Verified hours</span>
                <span className="text-[9px] text-[#078847] font-bold bg-[#D1FAE5] px-1.5 py-0.5 rounded">
                  Live Sync
                </span>
              </div>
              
              {/* Core Stats */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-[0_2px_6px_rgba(0,0,0,0.01)] text-center">
                  <div className="text-sm font-black text-[#078847]">48 hrs</div>
                  <div className="text-[8px] text-gray-400 font-semibold mt-0.5">Total Impact</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-[0_2px_6px_rgba(0,0,0,0.01)] text-center">
                  <div className="text-sm font-black text-purple-600">12</div>
                  <div className="text-[8px] text-gray-400 font-semibold mt-0.5">Projects Joined</div>
                </div>
              </div>

              {/* Chart Visual */}
              <div className="mt-3 bg-white p-2.5 rounded-lg border border-gray-100 shadow-[0_2px_6px_rgba(0,0,0,0.01)]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[7.5px] text-gray-400 font-bold uppercase tracking-wider">Weekly Activity</span>
                  <span className="text-[8px] text-gray-700 font-bold">+12.4%</span>
                </div>
                <svg className="w-full h-12" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path
                    d="M0 25 Q15 15, 30 20 T60 10 T90 5 T100 8"
                    fill="none"
                    stroke="#26DE81"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="30" cy="20" r="2.2" fill="#26DE81" stroke="#ffffff" strokeWidth="0.5" />
                  <circle cx="60" cy="10" r="2.2" fill="#26DE81" stroke="#ffffff" strokeWidth="0.5" />
                  <circle cx="90" cy="5" r="2.2" fill="#26DE81" stroke="#ffffff" strokeWidth="0.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Features Showcase Section (Large & Premium) */}
        <div className="mt-12">
          <h2 className="text-base font-black text-gray-800 mb-4 tracking-tight">
            How Ween Works
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Discover Opportunities", "Browse a personalized feed of local & remote volunteering events matching your skill set and interest.", "bg-[#D1FAE5] text-[#078847]", "⌕"],
              ["Participate Seamlessly", "Apply with a single tap and work together with peers and university clubs on verified events.", "bg-[#FFE4D6] text-[#E8551B]", "♟"],
              ["Verify Hours Instantly", "Leader QR codes provide immediate verification. Instantly generate official certificates for resumes.", "bg-[#DBEAFE] text-blue-600", "✓"]
            ].map(([title, text, badgeClass, icon], index) => (
              <div key={index} className="rounded-xl border border-gray-100 p-4 bg-[#F8FAFC] flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                <div>
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${badgeClass}`}>
                    {icon}
                  </div>
                  <h3 className="text-xs font-black text-gray-800 mt-3">
                    {title}
                  </h3>
                  <p className="text-[10px] leading-relaxed text-gray-500 mt-1.5 font-medium">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Extra Content: Impact Activity Feed */}
        <div className="mt-12">
          <h2 className="text-base font-black text-gray-800 mb-4 tracking-tight flex items-center justify-between">
            <span>Recent Community Achievements</span>
            <span className="text-[9px] text-gray-400 font-bold">Updated just now</span>
          </h2>

          <div className="space-y-2.5">
            {[
              ["Coastal cleanup", "Blue Tomorrow", "Completed", "4 hrs", "bg-emerald-100 text-emerald-800"],
              ["Community garden", "Grow Together", "Upcoming", "3 hrs", "bg-purple-100 text-purple-800"],
              ["Youth coding club", "Code Forward", "Upcoming", "2 hrs", "bg-purple-100 text-purple-800"]
            ].map(([title, org, status, hours, badgeClass], index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.01)]">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-700 border border-gray-100">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-800">{title}</div>
                    <div className="text-[8px] text-gray-400 font-medium">{org}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-extrabold text-gray-700">{hours}</span>
                  <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded-full ${badgeClass}`}>
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
