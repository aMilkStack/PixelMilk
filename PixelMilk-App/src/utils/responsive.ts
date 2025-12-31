/**
 * Responsive Design Utilities for PixelMilk
 *
 * Mobile-first breakpoints:
 * - Mobile: 0 - 767px (touch-first, stacked layouts)
 * - Tablet: 768px - 1023px (hybrid layouts)
 * - Desktop: 1024px+ (full Photoshop-style layouts)
 */

import { useState, useEffect } from 'react';

// ============================================
// BREAKPOINTS
// ============================================
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// ============================================
// TOUCH TARGET SIZES
// Apple recommends 44px minimum, Google recommends 48px
// ============================================
export const TAP_TARGET = {
  min: 44,
  comfortable: 48,
} as const;

// ============================================
// RESPONSIVE STATE
// ============================================
export interface ResponsiveState {
  device: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  width: number;
  height: number;
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
    navigator.maxTouchPoints > 0
  );
};

const getResponsiveState = (): ResponsiveState => {
  if (typeof window === 'undefined') {
    // SSR fallback
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

// ============================================
// MAIN HOOK
// ============================================
export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(getResponsiveState);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setState(getResponsiveState());
      }, 100);
    };

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

// ============================================
// CONVENIENCE HOOKS
// ============================================
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

// ============================================
// RESPONSIVE STYLE HELPERS
// ============================================

/**
 * Get touch-friendly button size
 */
export const getTapTargetSize = (isTouch: boolean, isMobile: boolean): number => {
  if (isTouch || isMobile) return TAP_TARGET.min;
  return 28;
};

/**
 * Get responsive spacing values
 */
export const getResponsiveSpacing = (isMobile: boolean, isTablet: boolean) => {
  if (isMobile) {
    return { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
  }
  if (isTablet) {
    return { xs: 4, sm: 8, md: 14, lg: 20, xl: 28 };
  }
  return { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
};

/**
 * Select value based on device type
 */
export function selectByDevice<T>(
  device: DeviceType,
  values: { mobile: T; tablet?: T; desktop?: T }
): T {
  if (device === 'mobile') return values.mobile;
  if (device === 'tablet') return values.tablet ?? values.mobile;
  return values.desktop ?? values.tablet ?? values.mobile;
}

export default useResponsive;
