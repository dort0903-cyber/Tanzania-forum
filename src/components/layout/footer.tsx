import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-semibold text-stone-900 dark:text-stone-50">
                Tanzania Forums
              </span>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Tanzania’s open forum for ideas, truth, and community.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">
              Community
            </h3>
            <ul className="space-y-2 text-sm text-stone-500 dark:text-stone-400">
              <li>
                <Link href="/guidelines" className="hover:text-brand-600 transition-colors">
                  Guidelines
                </Link>
              </li>
              <li>
                <Link href="/c/tzcheck" className="hover:text-brand-600 transition-colors">
                  TzCheck
                </Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-brand-600 transition-colors">
                  Trending
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">
              Legal
            </h3>
            <ul className="space-y-2 text-sm text-stone-500 dark:text-stone-400">
              <li>
                <Link href="/privacy" className="hover:text-brand-600 transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/transparency" className="hover:text-brand-600 transition-colors">
                  Transparency Report
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-600 transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">
              Developers
            </h3>
            <ul className="space-y-2 text-sm text-stone-500 dark:text-stone-400">
              <li>
                <Link href="/api" className="hover:text-brand-600 transition-colors">
                  API
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-600 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} Tanzania Forums. All rights reserved.
          </p>
          <p className="text-xs text-stone-400">
            Built with care for the people of Tanzania.
          </p>
        </div>
      </div>
    </footer>
  );
}
