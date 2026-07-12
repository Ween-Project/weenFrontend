import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "dark";
  fullWidth?: boolean;
};

const styles = {
  primary: "bg-lime text-ink hover:bg-[#ccf34f] focus:ring-lime",
  secondary: "border border-black/10 bg-white text-ink hover:bg-black/[0.03] focus:ring-black/10",
  dark: "bg-ink text-white hover:bg-forest focus:ring-ink/30",
};

export function Button({
  className = "",
  variant = "primary",
  fullWidth = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
