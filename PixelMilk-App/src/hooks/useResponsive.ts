/**
 * Centralised responsive design hook for PixelMilk
 *
 * Breakpoints:
 * - mobile: 0 - 767px (touch-first, stacked layouts)
 * - tablet: 768px - 1023px (hybrid layouts)
 * - desktop: 1024px+ (full Photoshop-style layouts)
 */

import { useState, useEffect, useCallback } from 'react';

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveState {
  // Device type
  device: DeviceType;

  // Boolean helpers
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Touch device detection
  isTouch: boolean;

  // Viewport dimensions
  width: number;
  height: number;

  // Orientation
  isPortrait: boolean;
  isLandscape: boolean;
}

const getDeviceType = (width: number): DeviceType => {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
};

const getIsTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
};

const getResponsiveState = (): ResponsiveState => {
  if (typeof window === 'undefined') {
    // SSR fallback - assume desktop
    return {
      device: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouch: false,
      width: 1920,
      height: 1080,
      isPortrait: false,
      isLandscape: true,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const device = getDeviceType(width);

  return {
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isTouch: getIsTouchDevice(),
    width,
    height,
    isPortrait: height > width,
    isLandscape: width >= height,
  };
};

/**
 * Main responsive hook - provides device type, dimensions, and helpers
 */
export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(getResponsiveState);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    // Debounced resize handler to avoid excessive re-renders
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setState(getResponsiveState());
      }, 100);
    };

    // Initial state
    setState(getResponsiveState());

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
};

/**
 * Simple boolean hooks for common use cases
 */
export const useIsMobile = (): boolean => {
  const { isMobile } = useResponsive();
  return isMobile;
};

export const useIsTablet = (): boolean => {
  const { isTablet } = useResponsive();
  return isTablet;
};

export const useIsDesktop = (): boolean => {
  const { isDesktop } = useResponsive();
  return isDesktop;
};

/**
 * Hook to get minimum tap target size based on device
 * Returns CSS value for touch-friendly sizing
 */
export const useTapTargetSize = (): string => {
  const { isTouch, isMobile } = useResponsive();
  // 44px is Apple's recommended minimum, 48px is Google's
  if (isTouch || isMobile) return '44px';
  return '28px'; // Desktop can use smaller targets
};

/**
 * Responsive spacing helper
 * Returns appropriate spacing based on device
 */
export interface ResponsiveSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export const useResponsiveSpacing = (): ResponsiveSpacing => {
  const { isMobile, isTablet } = useResponsive();

  if (isMobile) {
    return {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
    };
  }

  if (isTablet) {
    return {
      xs: '4px',
      sm: '8px',
      md: '14px',
      lg: '20px',
      xl: '28px',
    };
  }

  // Desktop
  return {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  };
};

/**
 * Breakpoint media query helper for inline styles
 * Returns a function to select values based on current device
 */
export const useBreakpointValue = <T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}): T => {
  const { device } = useResponsive();

  if (device === 'mobile') return values.mobile;
  if (device === 'tablet') return values.tablet ?? values.mobile;
  return values.desktop ?? values.tablet ?? values.mobile;
};

export default useResponsive;
