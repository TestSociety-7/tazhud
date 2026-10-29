/** Each new page fades in softly. Opacity only, so sticky and fixed bars stay in place. */
export default function StoreTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
