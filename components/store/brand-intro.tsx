import logo from "@/public/brand/tazhud-logo.jpg";

/**
 * A short opening the first time someone visits in a session: the pearl logo turns in
 * with its name, then the dark silk curtain lifts off the store on a wavy hem. It never blocks taps and is
 * skipped on later pages, on return visits in the same session and with reduced motion.
 */
const SKIP_SCRIPT = `try{if(sessionStorage.getItem("tz-intro")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("no-intro");else sessionStorage.setItem("tz-intro","1")}catch(e){document.documentElement.classList.add("no-intro")}`;

export function BrandIntro({ name }: { name: string }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
      <div className="brand-intro" aria-hidden>
        <span className="intro-curtain grid place-items-center">
          <span className="intro-mark">
            <span className="intro-rings">
              <span className="intro-coin">
                {/* eslint-disable-next-line @next/next/no-img-element -- small static brand mark */}
                <img src={logo.src} alt="" width={150} height={150} />
              </span>
            </span>
            <span className="intro-name font-display">{name}</span>
            <span className="intro-line" />
          </span>
        </span>
      </div>
    </>
  );
}
