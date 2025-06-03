/**
 * Bundle loader utility for dynamically loading bundled JavaScript files
 */

/**
 * Loads a bundled JavaScript file and returns a promise that resolves when the bundle is loaded
 * 
 * @param {string} bundleName - The name of the bundle to load (without .bundle.js)
 * @returns {Promise} - A promise that resolves when the bundle is loaded
 */
export async function loadBundle(bundleName) {
  return new Promise((resolve, reject) => {
    try {
      const url = chrome.runtime.getURL(`dist/${bundleName}.bundle.js`);
      const script = document.createElement('script');
      script.src = url;
      script.type = 'text/javascript';
      
      script.onload = () => {
        resolve(window[bundleName]);
      };
      
      script.onerror = (error) => {
        reject(new Error(`Failed to load bundle: ${bundleName}`, { cause: error }));
      };
      
      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });
} 