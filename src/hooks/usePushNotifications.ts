import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<NotificationSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription.toJSON() as NotificationSubscription);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Permission Granted",
          description: "You can now receive push notifications.",
        });
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notifications are disabled. You can enable them in your browser settings.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
      return false;
    }
  };

  const subscribe = async () => {
    if (!isSupported || permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Generate VAPID key (in production, this should come from your backend)
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80YkO4KE_QiAu6f3-18r7H0tO5ozvNhsHTxfHfYDxf0mDdS5gQA1WXFM';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const subscriptionJson = subscription.toJSON() as NotificationSubscription;
      setSubscription(subscriptionJson);
      setIsSubscribed(true);

      // In a real app, you would send this subscription to your backend
      console.log('Push subscription:', subscriptionJson);
      
      toast({
        title: "Subscribed!",
        description: "You will now receive push notifications.",
      });

      return subscriptionJson;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to subscribe to push notifications.",
        variant: "destructive",
      });
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        setIsSubscribed(false);
        
        toast({
          title: "Unsubscribed",
          description: "You will no longer receive push notifications.",
        });
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe from push notifications.",
        variant: "destructive",
      });
    }
  };

  const sendTestNotification = () => {
    if (!isSupported || permission !== 'granted') {
      toast({
        title: "Permission Required",
        description: "Please enable notifications first.",
        variant: "destructive",
      });
      return;
    }

    // Send a test notification
    new Notification('Test Notification', {
      body: 'This is a test notification from your app!',
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
  };

  return {
    isSupported,
    subscription,
    isSubscribed,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}