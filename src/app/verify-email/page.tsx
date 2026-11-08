"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { AlertCircle, ArrowRight, CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const CODE_LENGTH = 6;

function maskEmail(email: string) {
  if (!email || !email.includes("@")) return email;
  const [localPart, domain] = email.split("@");
  const visible = localPart.charAt(0) || "";
  const masked = visible + "*".repeat(Math.max(3, Math.min(6, localPart.length - 1)));
  return `${masked}@${domain}`;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = useMemo(() => {
    return (searchParams.get("email") || "").trim().toLowerCase();
  }, [searchParams]);
  const { verifyEmail, resendVerification } = useAuth();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);

  useEffect(() => {
    if (!email) {
      router.replace("/register");
      return;
    }

    inputRefs.current[0]?.focus();
  }, [email, router]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((prev) => Math.max(0, prev - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const codeValue = digits.join("");

  const setDigitAt = (index: number, value: string) => {
    const nextDigits = [...digits];
    nextDigits[index] = value.replace(/\D/g, "").slice(-1);
    setDigits(nextDigits);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeSubmit = useCallback(async () => {
    const normalizedCode = codeValue.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await verifyEmail(email, normalizedCode);
      setNotice("Email verified successfully.");
      setTimeout(() => router.replace("/dashboard"), 500);
    } catch (err: unknown) {
      const responseData = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data
        : undefined;
      setError(responseData?.message || "Invalid or expired code");
    } finally {
      setIsSubmitting(false);
    }
  }, [codeValue, email, router, verifyEmail]);

  useEffect(() => {
    if (codeValue.length === CODE_LENGTH) {
      void handleCodeSubmit();
    }
  }, [codeValue, handleCodeSubmit]);

  const handlePasting = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;

    const nextDigits = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((digit, index) => {
      if (index < CODE_LENGTH) {
        nextDigits[index] = digit;
      }
    });
    setDigits(nextDigits);

    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleBackspace = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || isResending) return;

    setIsResending(true);
    setError(null);

    try {
      await resendVerification(email);
      setNotice("A new verification code was sent.");
      setResendSeconds(60);
    } catch (err: unknown) {
      const responseData = axios.isAxiosError<{
        message?: string;
        retryAfterSeconds?: number;
      }>(err)
        ? err.response?.data
        : undefined;
      const retryAfter = responseData?.retryAfterSeconds ?? 60;
      setResendSeconds(retryAfter);
      setError(responseData?.message || "Please wait before requesting a new code.");
    } finally {
      setIsResending(false);
    }
  };

  const resendLabel = resendSeconds > 0 ? `Resend code (${resendSeconds}s)` : "Resend code";

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-to-b from-indigo-50 via-white to-slate-50">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-indigo-500/5 sm:p-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify your email</h1>
          <p className="mt-2 text-xs text-slate-500">
            We sent a 6-digit code to <span className="font-semibold text-slate-700">{maskEmail(email)}</span>
          </p>
        </div>

        {error && (
          <div aria-live="polite" className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div aria-live="polite" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="space-y-5">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {Array.from({ length: CODE_LENGTH }).map((_, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digits[index]}
                onChange={(event) => setDigitAt(index, event.target.value)}
                onPaste={handlePasting}
                onKeyDown={(event) => handleBackspace(index, event)}
                className="h-12 w-10 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:h-14 sm:w-12"
                aria-label={`Verification digit ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleCodeSubmit}
            disabled={isSubmitting || codeValue.length !== CODE_LENGTH}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Verifying..." : "Verify email"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 text-xs text-slate-600">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSeconds > 0 || isResending}
            className="inline-flex items-center gap-2 font-medium text-indigo-600 transition hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`} />
            {isResending ? "Sending..." : resendLabel}
          </button>

          <Link href="/register" className="font-medium text-slate-500 hover:text-slate-700">
            Use a different email
          </Link>
        </div>
      </div>
    </div>
  );
}
