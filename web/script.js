// Small helper to keep copyright year updated
document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.getElementById('dd-year');
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }
  
  // Setup Amazon affiliate links to open app on mobile
  setupAmazonDeepLinks();
});

/**
 * Detect if user is on mobile device
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if user is on Android
 */
function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

/**
 * Detect if user is on iOS
 */
function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Open Amazon app with affiliate link, fallback to web
 * Make it globally accessible for onclick handlers
 */
window.openAmazonLink = function(webUrl, event) {
  if (!isMobileDevice()) {
    // Desktop: just open web link normally
    return true;
  }
  
  // Prevent default link behavior
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  let appUrl = null;
  const fallbackUrl = webUrl;
  
  try {
    // Extract the path from web URL for app deep linking
    const urlObj = new URL(webUrl);
    const path = urlObj.pathname + urlObj.search;
    
    if (isAndroid()) {
      // Android: Use Intent URL to open Amazon Shopping app
      // Package name: in.amazon.mShop.android.shopping
      // The browser_fallback_url will automatically open web if app is not installed
      appUrl = `intent://www.amazon.in${path}#Intent;scheme=https;package=in.amazon.mShop.android.shopping;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
    } else if (isIOS()) {
      // iOS: Use amzn:// scheme
      appUrl = `amzn://www.amazon.in${path}`;
    }
    
    if (appUrl) {
      // Track if we're still on the page
      let appOpened = false;
      const startTime = Date.now();
      
      // Listen for page visibility change (app opened = page hidden)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          appOpened = true;
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Try to open app
      window.location.href = appUrl;
      
      // Fallback: If app doesn't open within 1.5 seconds, open web URL
      setTimeout(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (!appOpened) {
          // App didn't open, fallback to web
          window.location.href = fallbackUrl;
        }
      }, 1500);
    } else {
      // Fallback to web
      window.location.href = fallbackUrl;
    }
  } catch (error) {
    // If URL parsing fails, just open web URL
    console.warn('Failed to parse Amazon URL, opening web version:', error);
    window.location.href = fallbackUrl;
  }
  
  return false;
};

/**
 * Setup Amazon affiliate links to use deep linking
 */
function setupAmazonDeepLinks() {
  // Find all Amazon affiliate links
  const amazonLinks = document.querySelectorAll('a[href*="amazon.in"], a[href*="amazon.com"]');
  
  amazonLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // Only process if it's an Amazon link
    if (href && (href.includes('amazon.in') || href.includes('amazon.com'))) {
      // Add click handler
      link.addEventListener('click', (event) => {
        openAmazonLink(href, event);
      });
      
      // For better UX, we can also add data attributes
      link.setAttribute('data-amazon-link', 'true');
    }
  });
}

