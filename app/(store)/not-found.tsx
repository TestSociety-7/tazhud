import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="container-x py-16">
      <EmptyState title="Page not found" body="The page you're looking for has moved or no longer exists." action={<Link href="/shop" className="btn btn-primary">Browse the collection</Link>} />
    </div>
  );
}
