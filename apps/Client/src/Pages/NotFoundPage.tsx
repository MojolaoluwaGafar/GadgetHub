import { Compass } from "lucide-react";
import { EmptyState } from "../Components";
import Button from "../Components/Button";

export default function NotFoundPage() {
  return (
    <EmptyState
      className="min-h-[50vh] justify-center"
      icon={<Compass />}
      title="We couldn't find that page"
      text="The link may be old, or the page may have moved."
      action={
        <div className="flex gap-3">
          <Button to="/">Go home</Button>
          <Button to="/products" variant="outline">
            Browse products
          </Button>
        </div>
      }
    />
  );
}
