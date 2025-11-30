import { useEffect } from 'react';

const useUmamiHeartbeat = (interval = 300000) => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (window.umami && document.visibilityState === 'visible') {
        window.umami.track('heartbeat', {
          path: window.location.pathname,
        });
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval]);
};

export default useUmamiHeartbeat;