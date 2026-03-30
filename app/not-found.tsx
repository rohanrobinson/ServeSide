import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[60vh] w-full max-w-3xl place-items-center px-4 py-8">
      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-zinc-600">The event or invite link might be invalid.</p>
        <Link href="/" className="text-sm underline">
          Go to home
        </Link>
      </div>
    </main>
  );
}
