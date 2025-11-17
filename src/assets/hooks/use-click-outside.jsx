import { useEffect } from "react";

export const useClickOutside = (refs, callback) => {
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const isOutside = refs.every(
        (ref) => !ref?.current?.contains(event.target)
      );
      if (isOutside && typeof callback === "function") {
        callback(event);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);

    // Cleanup function
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [refs, callback]); // Make sure refs array is stable
};
