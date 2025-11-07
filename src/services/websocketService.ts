import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    console.log('🔌 Connecting to WebSocket...');
    console.log('🔑 Token details:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    this.socket = io('http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Subscribe to notifications
      this.socket?.emit('subscribe_notifications');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message || error);
      this.handleReconnect();
    });

    this.socket.on('new_notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      this.handleNewNotification(notification);
    });

    this.socket.on('unread_count_update', (data) => {
      console.log('📊 Unread count update:', data.count);
      this.handleUnreadCountUpdate(data.count);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('unsubscribe_notifications');
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket disconnected');
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          this.connect(token);
        }
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  private handleNewNotification(notification: any) {
    // Dispatch custom event for notification
    const event = new CustomEvent('websocket-notification', {
      detail: notification
    });
    window.dispatchEvent(event);
  }

  private handleUnreadCountUpdate(count: number) {
    // Dispatch custom event for unread count update
    const event = new CustomEvent('websocket-unread-count', {
      detail: { count }
    });
    window.dispatchEvent(event);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();