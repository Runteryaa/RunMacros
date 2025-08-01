"use client";
import SignInwithGoogle from "@/components/SignInWithGoogle";

export default function OnboardingPage() {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-3xl font-bold">Welcome to RunMacros!</h1>
      < SignInwithGoogle />
    </div>
  );
}