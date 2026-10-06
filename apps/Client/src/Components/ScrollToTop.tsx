import { useEffect } from "react";
import { useLocation } from "react-router";

// Start each new page at the top (the browser keeps the old scroll position
// when only the route changes).
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
