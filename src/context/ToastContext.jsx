import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const DURATION = 3200;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message, options = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const entry = {
        id,
        message,
        tone: options.tone || 'default',
        description: options.description,
        icon: options.icon,
      };
      setToasts((current) => [...current.slice(-2), entry]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), options.duration || DURATION)
      );
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}

export default ToastContext;
