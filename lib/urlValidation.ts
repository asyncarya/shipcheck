export function validateUrl(urlString: string): { isValid: boolean; error?: string; isWarning?: boolean } {
  if (!urlString) {
    return { isValid: false, error: 'URL is required.' };
  }

  try {
    // Add protocol if not present
    let formattedUrl = urlString.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const url = new URL(formattedUrl);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are supported.' };
    }

    // Basic hostname validation
    if (!url.hostname || url.hostname.indexOf('.') === -1 && url.hostname !== 'localhost') {
      return { isValid: false, error: 'Please enter a valid website domain.' };
    }

    if (url.protocol === 'http:') {
      return { isValid: true, isWarning: true, error: 'The URL uses unsecure HTTP. HTTPS is recommended.' };
    }

    return { isValid: true };
  } catch (e) {
    return { isValid: false, error: 'Please enter a valid URL (e.g. https://example.com).' };
  }
}

export function formatUrl(urlString: string): string {
  let formattedUrl = urlString.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }
  return formattedUrl;
}
