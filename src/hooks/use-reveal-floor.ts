import { useEffect, useState } from "react";

/**
 * A floor under `whileInView` reveals. iOS Safari can stop delivering scroll
 * updates to the page after a slow load, and then an IntersectionObserver
 * never fires and a block that starts hidden stays hidden. This turns true
 * after `ms`, so the section shows regardless; on a normal load the observer
 * wins long before.
 */
export function useRevealFloor(ms = 3000): boolean {
  const [reached, setReached] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReached(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return reached;
}
