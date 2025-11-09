const LoginApi = async (url, user, pass) => {
  const response = await fetch(`${url}wp-json/meup/v1/login/`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user, pass }),
  });

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Network error: ${response.status}`);
  }

  if (contentType.includes('text/html') || text.trim().startsWith('<')) {
    return { html: text };
  }

  const data = JSON.parse(text);
  return data;
};

module.exports = LoginApi;
