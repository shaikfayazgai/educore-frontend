"use client";

import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden w-[480px] flex-col justify-between bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-10 text-white lg:flex">
        <div className="inline-flex w-fit items-center rounded-lg bg-white px-3 py-2">
          <Image
            src="/glimmora-logo.png"
            alt="Glimmora Educore"
            width={160}
            height={36}
            priority
            style={{ height: "36px", width: "auto", display: "block" }}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            Education Intelligence
            <br />
            Infrastructure
          </h2>
          <p className="text-base leading-relaxed text-white/70">
            AI-native platform unifying student development, research
            intelligence, placement matching, compliance monitoring, and
            institutional strategy across universities worldwide.
          </p>
        </div>

        <p className="text-sm text-white/40">
          &copy; {new Date().getFullYear()} Glimmora. All rights reserved.
        </p>
      </div>

      {/* Right panel — auth forms */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
