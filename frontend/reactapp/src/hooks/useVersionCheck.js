import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false); // will prolly do something with this later
  const location = useLocation();

  useEffect(() => {
    let localVersion = null;

    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
           cache: 'no-store'
        });
        const data = await response.json();
        const serverVersion = data.version;

        if (!localVersion) {
          localVersion = serverVersion;
          return;
        }

        if (serverVersion !== localVersion) {
          
          const isUserBusy = location.pathname.includes('/playground') || 
                            location.pathname.includes('/snippet') || 
                             location.pathname.includes('/ide');

          if (isUserBusy) {
            setUpdateAvailable(true);
          } else {
            console.log("New version found. Auto-reloading...");
            window.location.reload();
            console.log("Reloaded to new version.");
          }
        }
      } catch (error) {
        console.error("Failed to check version:", error);
      }
    };

    // Check every 60 seconds
    const interval = setInterval(checkVersion, 60 * 1000);
    
    // Check on window focus (tab switch)
    window.addEventListener('focus', checkVersion);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkVersion);
    };
  }, [location.pathname]); // Re-run logic if location changes

  return { updateAvailable, reloadPage: () => window.location.reload() };
}