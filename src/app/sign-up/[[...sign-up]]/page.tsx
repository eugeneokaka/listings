"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <SignUp
        appearance={{
          elements: {
            card: "shadow-md border rounded-xl",
            formButtonPrimary: "bg-red-600 hover:bg-red-700 text-white",
          },
        }}
        afterSignUpUrl="/complete-profile"
      />
    </div>
  );
}
