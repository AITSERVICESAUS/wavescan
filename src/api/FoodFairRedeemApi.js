const ensureTrailingSlash = url => {
  if (!url) {
    return 'https://ticketwave.com.au/';
  }

  return url.endsWith('/') ? url : `${url}/`;
};

const redeemFoodFairTicket = async (siteUrl, qrToken, staffToken = '') => {
  const baseUrl = ensureTrailingSlash(siteUrl);

  const response = await fetch(`${baseUrl}wp-json/twff/v1/redeem`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(staffToken ? {Authorization: `Bearer ${staffToken}`} : {}),
    },
    body: JSON.stringify({
      token: qrToken,
    }),
  });

  const json = await response.json().catch(() => null);

  if (json?.status) {
    return json;
  }

  if (!response.ok) {
    const error = new Error(json?.message || 'Food Fair API request failed');
    error.response = json;
    error.statusCode = response.status;
    throw error;
  }

  return json;
};

export default redeemFoodFairTicket;
