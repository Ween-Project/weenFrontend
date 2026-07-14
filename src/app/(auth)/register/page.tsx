"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError, errorMessage } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TagInput } from "@/components/ui/TagInput";
import { UniversitySelect } from "@/components/ui/UniversitySelect";

type Fields = Record<string, string>;
const courses = ["I Year", "II Year", "III Year", "IV Year", "V Year", "VI Year"];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [accountType, setAccountType] = useState<"user" | "organization">("user");
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState<Fields>({});
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [errors, setErrors] = useState<Fields>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // File upload states
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ween-registration-draft") || "null");
      const query = new URLSearchParams(window.location.search);
      const referral = (query.get("refferalCode") || query.get("referralCode") || query.get("ref") || "").trim().toUpperCase();
      if (saved) {
        setAccountType(saved.accountType || "user");
        setStep(saved.step || 1);
        setFields({ ...saved.fields, ...(referral ? { referralCode: referral } : {}) });
        setSkills(saved.skills || []);
        setInterests(saved.interests || []);
      } else if (referral) {
        setFields({ referralCode: referral });
      }
    } catch {} finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const safeFields = { ...fields };
    delete safeFields.password;
    localStorage.setItem(
      "ween-registration-draft",
      JSON.stringify({ accountType, step, fields: safeFields, skills, interests })
    );
  }, [accountType, step, fields, skills, interests, hydrated]);

  const maxSteps = accountType === "user" ? 5 : 3;
  const value = (name: string) => fields[name] || "";
  const change = (name: string, next: string) => {
    setFields((current) => ({ ...current, [name]: next }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  function validate(currentStep = step, isFinal = false) {
    const next: Fields = {};
    if (isFinal || currentStep === 1) {
      if (value("username").trim().length < 3 || value("username").length > 50)
        next.username = "Username must be 3–50 characters.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email")))
        next.email = "Enter a valid email.";
      if (value("password").length < 8)
        next.password = "Password must be at least 8 characters.";
      if (accountType === "user" && !value("fullName").trim())
        next.fullName = "Full name is required.";
      if (accountType === "organization" && !value("organizationName").trim())
        next.organizationName = "Organization name is required.";
    }
    if (isFinal || currentStep === 2) {
      if (accountType === "user" && value("course") && !courses.includes(value("course")))
        next.course = "Select a course year.";
      if (accountType === "organization" && !value("description").trim())
        next.description = "Description is required.";
    }
    if (isFinal || (accountType === "user" && currentStep === 5)) {
      if (value("referralCode") && !/^[A-Za-z0-9]{4,20}$/.test(value("referralCode")))
        next.referralCode = "Referral code must contain 4–20 letters or numbers.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      if (next.username || next.email || next.password || next.fullName || next.organizationName) {
        setStep(1);
      } else if (next.course || next.description) {
        setStep(2);
      } else if (next.referralCode) {
        setStep(5);
      }
      return false;
    }
    return true;
  }

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBanner(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  function next() {
    if (validate(step)) setStep((current) => Math.min(maxSteps, current + 1));
  }

  async function submit() {
    if (step !== maxSteps || !validate(step, true)) return;

    const fd = new FormData();
    fd.append("accountType", accountType);
    fd.append("username", value("username").trim());
    fd.append("email", value("email").trim());
    fd.append("password", value("password"));

    if (accountType === "user") {
      fd.append("fullName", value("fullName").trim());
      if (value("birthDate")) fd.append("birthDate", value("birthDate"));
      if (value("phone")) fd.append("phone", value("phone"));
      if (value("university")) fd.append("university", value("university"));
      if (value("major")) fd.append("major", value("major"));
      if (value("course")) fd.append("course", value("course"));
      if (interests.length > 0) fd.append("interests", interests.join(", "));
      if (skills.length > 0) fd.append("skills", skills.join(", "));
      if (value("referralCode")) fd.append("referralCode", value("referralCode"));
      if (profilePhoto) fd.append("profilePhoto", profilePhoto);
      if (banner) fd.append("banner", banner);
    } else {
      fd.append("organizationName", value("organizationName").trim());
      fd.append("description", value("description").trim());
      if (value("website")) fd.append("website", value("website"));
      if (logo) fd.append("logo", logo);
      if (banner) fd.append("banner", banner);
    }

    setSubmitting(true);
    setRequestError("");
    try {
      await register(fd);
      localStorage.removeItem("ween-registration-draft");
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        if (
          error.fieldErrors.username ||
          error.fieldErrors.email ||
          error.fieldErrors.password ||
          error.fieldErrors.fullName ||
          error.fieldErrors.organizationName
        ) {
          setStep(1);
        } else if (
          error.fieldErrors.course ||
          error.fieldErrors.description ||
          error.fieldErrors.major ||
          error.fieldErrors.birthDate ||
          error.fieldErrors.phone ||
          error.fieldErrors.university
        ) {
          setStep(2);
        } else if (error.fieldErrors.skills || error.fieldErrors.interests) {
          setStep(3);
        } else if (error.fieldErrors.referralCode) {
          setStep(5);
        }
      }
      setRequestError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[.9fr_1.1fr]">
      <section className="hidden bg-[#0e1f19] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="text-2xl font-black text-lime">
          ween
        </Link>
        <div>
          <p className="text-sm font-black uppercase tracking-[.25em] text-lime">Join the movement</p>
          <h1 className="mt-5 max-w-xl text-5xl font-black leading-[1.08]">Build your impact profile, one step at a time.</h1>
          <p className="mt-6 max-w-md leading-7 text-white/55">
            Connect with people, discover events and turn meaningful work into a story worth sharing.
          </p>
        </div>
        <p className="text-xs text-white/35">Secure authentication · Real community · Verified impact</p>
      </section>

      <section className="flex items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-black text-emerald-700 lg:hidden">
              ween
            </Link>
            <Link href="/login" className="ml-auto text-sm font-bold text-slate-500">
              Already a member? <span className="text-emerald-700">Sign in</span>
            </Link>
          </div>
          <div className="mt-8">
            <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">
              Step {step} of {maxSteps}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {step === 1
                ? "Create your account"
                : accountType === "organization"
                ? step === 2
                  ? "Tell us about your organization"
                  : "Upload logo and banner"
                : step === 2
                ? "Your education"
                : step === 3
                ? "What defines you?"
                : step === 4
                ? "Customize your profile"
                : "Finish your profile"}
            </h2>
            <div className="mt-5 flex gap-2">
              {Array.from({ length: maxSteps }, (_, index) => (
                <span key={index} className={`h-1.5 flex-1 rounded-full ${index < step ? "bg-emerald-600" : "bg-slate-200"}`} />
              ))}
            </div>
          </div>

          {requestError && (
            <div className="mt-5">
              <Alert>{requestError}</Alert>
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (step < maxSteps) next();
            }}
            className="mt-7"
            noValidate
          >
            {/* Step 1: Credentials */}
            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Account type</p>
                  <div className="grid grid-cols-2 rounded-xl bg-slate-200 p-1">
                    {(["user", "organization"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setAccountType(type);
                          setStep(1);
                          setErrors({});
                        }}
                        className={`rounded-lg px-3 py-3 text-sm font-bold capitalize ${
                          accountType === type ? "bg-white shadow-sm" : "text-slate-500"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                {accountType === "user" ? (
                  <Input
                    id="fullName"
                    label="Full name"
                    value={value("fullName")}
                    onChange={(e) => change("fullName", e.target.value)}
                    error={errors.fullName}
                    maxLength={120}
                  />
                ) : (
                  <Input
                    id="organizationName"
                    label="Organization name"
                    value={value("organizationName")}
                    onChange={(e) => change("organizationName", e.target.value)}
                    error={errors.organizationName}
                    maxLength={200}
                  />
                )}
                <Input
                  id="username"
                  label="Username"
                  value={value("username")}
                  onChange={(e) => change("username", e.target.value)}
                  error={errors.username}
                  maxLength={50}
                />
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  value={value("email")}
                  onChange={(e) => change("email", e.target.value)}
                  error={errors.email}
                  maxLength={150}
                />
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  value={value("password")}
                  onChange={(e) => change("password", e.target.value)}
                  error={errors.password}
                />
              </div>
            )}

            {/* User Step 2: Education */}
            {accountType === "user" && step === 2 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <UniversitySelect value={value("university")} onChange={(next) => change("university", next)} error={errors.university} />
                </div>
                <Input
                  id="major"
                  label="Major / field of study"
                  value={value("major")}
                  onChange={(e) => change("major", e.target.value)}
                  error={errors.major}
                  maxLength={100}
                />
                <div>
                  <label htmlFor="course" className="mb-2 block text-sm font-semibold text-slate-700">
                    Course year
                  </label>
                  <select
                    id="course"
                    value={value("course")}
                    onChange={(e) => change("course", e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                  >
                    <option value="">Select year</option>
                    {courses.map((course) => (
                      <option key={course}>{course}</option>
                    ))}
                  </select>
                  {errors.course && <p className="mt-1 text-xs text-red-600">{errors.course}</p>}
                </div>
                <Input
                  id="birthDate"
                  label="Birth date"
                  type="date"
                  value={value("birthDate")}
                  onChange={(e) => change("birthDate", e.target.value)}
                  error={errors.birthDate}
                />
                <Input
                  id="phone"
                  label="Phone"
                  value={value("phone")}
                  onChange={(e) => change("phone", e.target.value)}
                  error={errors.phone}
                  maxLength={20}
                />
              </div>
            )}

            {/* User Step 3: Skills & Interests */}
            {accountType === "user" && step === 3 && (
              <div className="space-y-6">
                <TagInput
                  label="Skills"
                  values={skills}
                  onChange={setSkills}
                  placeholder="e.g. JavaScript — press Enter"
                  error={errors.skills}
                />
                <TagInput
                  label="Interests"
                  values={interests}
                  onChange={setInterests}
                  placeholder="e.g. Climate action — press Enter"
                  error={errors.interests}
                />
                <p className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-700">
                  Add each item separately. Press Enter to create a tag; use × to remove it.
                </p>
              </div>
            )}

            {/* User Step 4: Customization */}
            {accountType === "user" && step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Profile Picture</h3>
                  <p className="text-xs text-slate-500 mt-1">Upload a photo so others recognize you. Skip if you want to add it later.</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative h-24 w-24 shrink-0 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                      {profilePreview ? (
                        <img src={profilePreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-4xl text-slate-300">👤</span>
                      )}
                    </div>
                    <div>
                      <input type="file" id="profile-upload" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
                      <Button type="button" variant="secondary" onClick={() => document.getElementById("profile-upload")?.click()}>
                        {profilePreview ? "Change photo" : "Upload photo"}
                      </Button>
                      {profilePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePhoto(null);
                            setProfilePreview("");
                          }}
                          className="ml-3 text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-700">Profile Banner (Optional)</h3>
                  <p className="text-xs text-slate-500 mt-1">Add a background image to make your profile stand out.</p>
                  <div className="mt-4 space-y-3">
                    <div className="relative h-32 w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                      {bannerPreview ? (
                        <img src={bannerPreview} alt="Banner Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <span className="text-2xl">🖼️</span>
                          <p className="text-xs mt-1">No banner selected</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <input type="file" id="banner-upload" accept="image/*" className="hidden" onChange={handleBannerChange} />
                      <Button type="button" variant="secondary" onClick={() => document.getElementById("banner-upload")?.click()}>
                        {bannerPreview ? "Change banner" : "Upload banner"}
                      </Button>
                      {bannerPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setBanner(null);
                            setBannerPreview("");
                          }}
                          className="ml-3 text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Step 5: Referral & Summary */}
            {accountType === "user" && step === 5 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Input
                    id="referralCode"
                    label="Referral code (optional)"
                    value={value("referralCode")}
                    onChange={(e) => change("referralCode", e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
                    error={errors.referralCode}
                    maxLength={20}
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Your account is created only after you explicitly press “Create account”.
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase text-emerald-700">Ready to join</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{value("fullName")} · @{value("username")}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {value("university") || "University not specified"}
                    {value("course") ? ` · ${value("course")}` : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Organization Step 2: Details */}
            {accountType === "organization" && step === 2 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Textarea
                    id="description"
                    label="Organization description"
                    value={value("description")}
                    onChange={(e) => change("description", e.target.value)}
                    error={errors.description}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    id="website"
                    label="Website"
                    type="url"
                    value={value("website")}
                    onChange={(e) => change("website", e.target.value)}
                    error={errors.website}
                    maxLength={300}
                  />
                </div>
              </div>
            )}

            {/* Organization Step 3: Logo & Banner */}
            {accountType === "organization" && step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Organization Logo</h3>
                  <p className="text-xs text-slate-500 mt-1">Upload a logo for your organization profile. Skip if you want to add it later.</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative h-24 w-24 shrink-0 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-4xl text-slate-300">🏢</span>
                      )}
                    </div>
                    <div>
                      <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoChange} />
                      <Button type="button" variant="secondary" onClick={() => document.getElementById("logo-upload")?.click()}>
                        {logoPreview ? "Change logo" : "Upload logo"}
                      </Button>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogo(null);
                            setLogoPreview("");
                          }}
                          className="ml-3 text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-700">Cover Banner (Optional)</h3>
                  <p className="text-xs text-slate-500 mt-1">Add a banner image for your organization page header.</p>
                  <div className="mt-4 space-y-3">
                    <div className="relative h-32 w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                      {bannerPreview ? (
                        <img src={bannerPreview} alt="Banner Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <span className="text-2xl">🖼️</span>
                          <p className="text-xs mt-1">No banner selected</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <input type="file" id="org-banner-upload" accept="image/*" className="hidden" onChange={handleBannerChange} />
                      <Button type="button" variant="secondary" onClick={() => document.getElementById("org-banner-upload")?.click()}>
                        {bannerPreview ? "Change banner" : "Upload banner"}
                      </Button>
                      {bannerPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setBanner(null);
                            setBannerPreview("");
                          }}
                          className="ml-3 text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button type="button" variant="secondary" onClick={() => setStep((current) => current - 1)}>
                  Back
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                {((accountType === "user" && step === 4) || (accountType === "organization" && step === 3)) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (accountType === "user") {
                        setStep(5);
                      } else {
                        void submit();
                      }
                    }}
                    className="text-sm font-bold text-slate-500 hover:text-slate-800 px-4 py-2 hover:bg-slate-100 rounded-xl transition"
                  >
                    Skip now
                  </button>
                )}
                {step < maxSteps ? (
                  <Button type="button" variant="dark" onClick={next}>
                    Continue
                  </Button>
                ) : (
                  <Button type="button" variant="dark" disabled={submitting} onClick={() => void submit()}>
                    {submitting ? "Creating account…" : "Create account"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
