import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-extrabold text-emerald-500 tracking-tight">
          Access Denied
        </h1>
        <p className="text-gray-400 text-sm">
          You do not have the required permissions (Premium User or Admin) to access this feature.
        </p>
        <div className="pt-4">
          <Link
            href="/portfolio"
            className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-semibold px-6 py-3 rounded-lg transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
