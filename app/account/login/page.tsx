import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <div className="mx-auto max-w-sm px-4 py-24 sm:px-6">
      <h1 className="font-display text-center text-2xl">Sign in</h1>
      <p className="mt-2 text-center text-sm text-[var(--color-ink-soft)]">
        Sign in to view your orders and check out faster.
      </p>

      {error && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6">
        <GoogleSignInButton next={next} />
      </div>
    </div>
  );
}
