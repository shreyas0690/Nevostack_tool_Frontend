import { useEffect, useCallback } from 'react';

interface DeviceInfo {
  deviceName?: string;
  touchSupport?: boolean;
  webGLSupport?: boolean;
  cookieEnabled?: boolean;
  doNotTrack?: boolean;
  screenResolution?: string;
  colorDepth?: number;
  pixelRatio?: number;
}

interface ActivityData {
  action: string;
  details?: any;
  pageView?: boolean;
}

export const useDeviceActivity = () => {
  // Get device information
  const getDeviceInfo = useCallback((): DeviceInfo => {
    if (typeof window === 'undefined') return {};

    return {
      deviceName: `${navigator.platform} - ${navigator.userAgent.split(' ').pop()}`,
      touchSupport: 'ontouchstart' in window,
      webGLSupport: !!window.WebGLRenderingContext,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };
  }, []);

  // Record activity
  const recordActivity = useCallback(async (data: ActivityData) => {
    try {
      // In a real implementation, you would send this to your backend
      const activityData = {
        ...data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: getDeviceInfo()
      };

      console.log('Recording activity:', activityData);

      // Send to backend API
      const response = await fetch('/api/devices/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(activityData)
      });

      if (!response.ok) {
        console.error('Failed to record activity');
      }
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  }, [getDeviceInfo]);

  // Record page view
  const recordPageView = useCallback(() => {
    recordActivity({
      action: 'page_view',
      details: {
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer
      },
      pageView: true
    });
  }, [recordActivity]);

  // Record user action
  const recordAction = useCallback((action: string, details?: any) => {
    recordActivity({
      action,
      details
    });
  }, [recordActivity]);

  // Record form submission
  const recordFormSubmission = useCallback((formName: string, success: boolean) => {
    recordAction('form_submission', {
      form: formName,
      success,
      timestamp: new Date().toISOString()
    });
  }, [recordAction]);

  // Record button click
  const recordButtonClick = useCallback((buttonName: string, context?: string) => {
    recordAction('button_click', {
      button: buttonName,
      context,
      timestamp: new Date().toISOString()
    });
  }, [recordAction]);

  // Record navigation
  const recordNavigation = useCallback((from: string, to: string) => {
    recordAction('navigation', {
      from,
      to,
      timestamp: new Date().toISOString()
    });
  }, [recordAction]);

  // Record search
  const recordSearch = useCallback((query: string, results?: number) => {
    recordAction('search', {
      query,
      results,
      timestamp: new Date().toISOString()
    });
  }, [recordAction]);

  // Record file upload/download
  const recordFileAction = useCallback((action: 'upload' | 'download', fileName: string, fileSize?: number) => {
    recordAction('file_action', {
      type: action,
      fileName,
      fileSize,
      timestamp: new Date().toISOString()
    });
  }, [recordAction]);

  // Record error
  const recordError = useCallback((error: string, context?: string) => {
    recordAction('error', {
      error,
      context,
      timestamp: new Date().toISOString()
    });
  }, [recordAction]);

  // Record session start/end
  const recordSession = useCallback((action: 'start' | 'end') => {
    recordAction('session', {
      action,
      timestamp: new Date().toISOString()
    });
  }, [recordAction]);

  // Auto-record page views on route changes
  useEffect(() => {
    recordPageView();

    // Record page view when user navigates back/forward
    const handlePopState = () => {
      recordPageView();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [recordPageView]);

  // Record session start when component mounts
  useEffect(() => {
    recordSession('start');

    // Record session end when component unmounts
    return () => {
      recordSession('end');
    };
  }, [recordSession]);

  return {
    recordActivity,
    recordPageView,
    recordAction,
    recordFormSubmission,
    recordButtonClick,
    recordNavigation,
    recordSearch,
    recordFileAction,
    recordError,
    recordSession,
    getDeviceInfo
  };
};











