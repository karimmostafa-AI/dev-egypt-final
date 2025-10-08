'use client';

import { useNotifications } from '../../src/hooks/useNotifications';
import Toast from './Toast';

/**
 * ToastContainer Component
 * 
 * Renders all active notifications as toast messages
 * Automatically positions them and handles removal
 */
const ToastContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

export default ToastContainer;