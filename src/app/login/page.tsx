"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { FetchError, postFetcher } from "@/lib/client/api";
import type { LoginRequest, LoginResponse } from "@/types/contracts";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError("비밀번호를 입력하세요");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await postFetcher<LoginRequest, LoginResponse>("/api/auth/login", { password });
      router.push("/candidates");
      router.refresh();
    } catch (loginError) {
      if (loginError instanceof FetchError && loginError.code === "UNAUTHORIZED") {
        setError("비밀번호가 맞지 않습니다");
        return;
      }

      setError("로그인 설정을 확인하세요");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileContainer hasBottomNav={false}>
      <div className="flex flex-col items-center justify-center h-[80dvh] px-8">
        <div className="text-center mb-12">
          <h1 className="text-[56px] font-black tracking-tighter text-nine-primary leading-none mb-4">
            NINE
          </h1>
          <p className="text-nine-secondary font-medium tracking-tight">
            9점이 곧 신호
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <div className="mb-6">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
              className="w-full text-center bg-surface border border-border-color rounded-2xl py-4 text-[16px] focus:outline-none focus:border-nine-primary transition-colors"
            />
            {error && <p className="text-danger text-sm text-center mt-2">{error}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl font-bold text-lg bg-nine-primary text-white active:scale-[0.98] transition-transform shadow-sm disabled:opacity-60"
          >
            {isSubmitting ? "Logging in" : "Login"}
          </button>
        </form>
      </div>
    </MobileContainer>
  );
}
