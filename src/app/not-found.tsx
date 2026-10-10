import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-100 text-coral-600 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="font-heading text-3xl font-bold tracking-tight text-editorial-900">
        404 — Page Not Found
      </h1>
      <p className="mt-2 text-sm text-brand-muted max-w-sm">
        The requested resource, organization workspace, or route does not exist.
      </p>
      <div className="mt-6">
        <Link href="/dashboard">
          <Button variant="primary" size="md" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
