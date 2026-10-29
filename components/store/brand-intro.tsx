/**
 * A short opening the first time someone visits in a session: the coin turns in,
 * the name appears and two doors open onto the store. It never blocks taps and is
 * skipped on later pages, on return visits in the same session and with reduced motion.
 */
const SKIP_SCRIPT = `try{if(sessionStorage.getItem("tz-intro")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("no-intro");else sessionStorage.setItem("tz-intro","1")}catch(e){document.documentElement.classList.add("no-intro")}`;

export function BrandIntro({ name }: { name: string }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
      <div className="brand-intro" aria-hidden>
        <span className="intro-door intro-door-a" />
        <span className="intro-door intro-door-b" />
        <span className="intro-mark">
          <span className="intro-coin">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static brand mark */}
            <img src="/brand/tazhud-logo.jpg" alt="" width={150} height={150} />
          </span>
          <span className="intro-name font-display">{name}</span>
        </span>
      </div>
    </>
  );
}
