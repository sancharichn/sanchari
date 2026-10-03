import Link from "next/link";
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { SanchariLogo } from "./wordmark";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-ridge">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <SanchariLogo width={200} />
          <p className="stretch-wide mt-6 text-sm font-extrabold tracking-wide text-mist">TRAVEL WITH NATURE</p>
          <p className="measure mt-3 text-sm text-lichen">
            A Chennai travel group for treks, forest stays and coastal rides, planned together.
          </p>
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
            <li>
              <Link className="hover:text-mist" href="/feedback">
                Feedback
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
        <p className="container py-6 text-xs text-lichen">© {year} Sanchari Chennai</p>
      </div>
    </footer>
  );
}
