import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getCurrentUserSafe } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

const errorCopy: Record<string, string> = {
  AccessDenied:
    "That Google account can't be used here. Sign in with a Google account whose email address is verified.",
  OAuthSignin: "Google sign-in didn't start. Try again in a moment.",
  OAuthCallback: "Google sign-in didn't finish. Try again in a moment.",
  Callback: "Google sign-in didn't finish. Try again in a moment.",
  Configuration: "Sign-in isn't configured on this site yet. Write to sanchari.chn@gmail.com.",
  default: "Sign-in didn't work. Try again in a moment.",
};

/** Only allow same-site relative paths as the post-sign-in destination. */
function safeCallback(value: string | undefined) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const callbackUrl = safeCallback(searchParams.callbackUrl);
  const user = await getCurrentUserSafe();
  if (user) redirect(callbackUrl);

  const error = searchParams.error ? (errorCopy[searchParams.error] ?? errorCopy.default) : null;

  return (
    <main id="main" className="container flex min-h-[80dvh] items-center py-24">
      <div className="w-full max-w-lg">
        <h1 className="stretch-semiwide text-3xl font-bold leading-tight">Sign in to Sanchari</h1>
        <p className="measure mt-4 text-lichen">
          Use your Google account. You need to be signed in to register for trips, see your payment status and leave
          feedback.
        </p>

        {error ? (
          <p role="alert" className="mt-6 rounded-[10px] border border-ember/50 bg-ember/10 px-4 py-3 text-sm text-mist">
            {error}
          </p>
        ) : null}

        <div className="mt-8">
          <GoogleSignInButton callbackUrl={callbackUrl} />
        </div>
        <p className="measure mt-4 text-sm text-lichen">
          Google shares your name, email address and profile photo with us.{" "}
          <Link href="/privacy" className="text-mist underline underline-offset-4 hover:text-signal">
            What we keep and why
          </Link>
          .
        </p>

        <p className="mt-10 text-sm text-lichen">
          Just looking?{" "}
          <Link href="/trips" className="text-mist underline underline-offset-4 hover:text-signal">
            Browse upcoming trips
          </Link>{" "}
          without signing in.
        </p>
      </div>
    </main>
  );
}
