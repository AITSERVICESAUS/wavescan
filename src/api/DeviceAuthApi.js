// src/api/DeviceAuthApi.js

function buildEndpoint(baseUrl, path) {
  return `${baseUrl}wp-json/meup/v1/${path}`;
}

async function safeJsonWithMeta(res) {
  const text = await res.text();

  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = null;
  }

  // always return something structured
  return {
    http_status: res.status,
    ok: res.ok,
    json,
    raw: json ? null : text, // only include raw if not JSON
  };
}

export async function deviceRegisterApi(baseUrl, jwt, device_id, label = '') {
  const url = buildEndpoint(baseUrl, 'device_register/');

  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({token: jwt, device_id, label}),
  });

  return safeJsonWithMeta(res);
}

export async function deviceLoginApi(baseUrl, email, device_id, device_token) {
  const url = buildEndpoint(baseUrl, 'device_login/');

  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, device_id, device_token}),
  });

  return safeJsonWithMeta(res);
}

export async function deviceRevokeApi(baseUrl, jwt, device_id) {
  const url = buildEndpoint(baseUrl, 'device_revoke/');

  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({token: jwt, device_id}),
  });

  return safeJsonWithMeta(res);
}
