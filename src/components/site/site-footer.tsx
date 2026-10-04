import Link from "next/link";
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { SanchariLogo } from "./wordmark";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-ridge">
      <div className="container grid gap-10 py-14 sm:grid-cols-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="sm:col-span-3 md:col-span-1">
          <SanchariLogo width={200} />
          <p className="stretch-wide mt-6 text-sm font-extrabold tracking-wide text-mist">TRAVEL WITH NATURE</p>
          <p className="measure mt-3 text-sm text-lichen">
            The Chennai unit of Sanchari: a voluntary community of travel lovers, not a travel agency.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-mist">The group</h2>
          <ul className="mt-4 grid gap-2.5 text-sm text-lichen">
            <li>
              <Link className="hover:text-mist" href="/faq">
                About &amp; FAQ
              </Link>
            </li>
            <li>
              <Link className="hover:text-mist" href="/faq#guidelines">
                Guidelines
              </Link>
            </li>
            <li>
              <Link className="hover:text-mist" href="/feedback">
                Feedback
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-mist">Trips</h2>
          <ul className="mt-4 grid gap-2.5 text-sm text-lichen">
            <li>
              <Link className="hover:text-mist" href="/trips">
                Upcoming trips
              </Link>
            </li>
            <li>
              <Link className="hover:text-mist" href="/gallery">
                Gallery
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-mist">Contact</h2>
          <ul className="mt-4 grid gap-2.5 text-sm text-lichen">
            <li>
              <a className="break-all hover:text-mist" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <a className="hover:text-mist" href={INSTAGRAM_URL} rel="noopener noreferrer" target="_blank">
                Instagram @{INSTAGRAM_HANDLE}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ridge">
        <div className="container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 text-xs text-lichen">
          <p>© {year} Sanchari Chennai</p>
          <Link className="inline-block py-1 hover:text-mist" href="/privacy">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
