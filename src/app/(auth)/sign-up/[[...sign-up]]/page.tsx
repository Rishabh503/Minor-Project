import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "border border-surface-border shadow-warm bg-surface rounded-lg",
            headerTitle: "text-editorial-900 font-heading text-xl font-bold",
            headerSubtitle: "text-brand-muted text-xs",
            formButtonPrimary:
              "bg-editorial-800 hover:bg-editorial-700 text-white text-sm font-medium",
            formFieldInput:
              "border-surface-border focus:border-editorial-700 rounded-md text-sm",
            footerActionLink: "text-coral-500 hover:text-coral-600 font-medium",
          },
        }}
      />
    </div>
  );
}
