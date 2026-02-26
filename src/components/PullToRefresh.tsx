import React, { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const THRESHOLD = 80;
const MAX_PULL = 120;

const PullToRefresh: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const tracking = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY <= 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
      tracking.current = true;
    }
  }, [refreshing]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!tracking.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      setPullDistance(Math.min(dy * 0.5, MAX_PULL));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!tracking.current) return;
    tracking.current = false;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      // Simulate refresh by reloading data
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance]);

  useEffect(() => {
    if (!isMobile) return;
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, onTouchStart, onTouchMove, onTouchEnd]);

  if (!isMobile) return <>{children}</>;

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div className="relative">
      {/* Pull indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-opacity"
        style={{
          top: pullDistance - 40,
          opacity: progress,
        }}
      >
        <div className={`w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center shadow-lg ${refreshing ? "animate-spin" : ""}`}>
          <RefreshCw
            className="w-4 h-4 text-primary transition-transform"
            style={{ transform: refreshing ? undefined : `rotate(${progress * 360}deg)` }}
          />
        </div>
      </div>
      <div
        style={{ transform: `translateY(${pullDistance}px)`, transition: tracking.current ? "none" : "transform 0.3s ease-out" }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
