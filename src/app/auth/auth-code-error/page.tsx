import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-stone-50 dark:bg-stone-950">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
          Sign-in failed
        </h1>
        <p className="text-sm text-stone-500">
          We could not complete Google sign-in. Please try again. If it keeps
          failing, check that the redirect URL is set in Supabase Auth settings.
        </p>
        <Link
          href="/"
          className="inline-flex px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
