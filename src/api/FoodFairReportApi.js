const ensureTrailingSlash = url => {
  if (!url) {
    return 'https://staging2.ticketwave.com.au';
  }

  return url.endsWith('/') ? url : `${url}/`;
};

const getFoodFairReport = async (siteUrl, staffToken, eventId) => {
  const baseUrl = ensureTrailingSlash(siteUrl);
  const response = await fetch(`${baseUrl}wp-json/twff/v1/report`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_id: eventId,
      token: staffToken,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success !== true) {
    const error = new Error(data?.message || 'Unable to load Food Fair report.');
    error.statusCode = response.status;
    error.response = data;
    throw error;
  }

  return data;
};

export default getFoodFairReport;
