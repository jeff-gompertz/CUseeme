export async function handler(event) {
  const targetUrl = event.queryStringParameters.url;
  if (!targetUrl) {
    return {
      statusCode: 400,
      body: 'Missing ?url= parameter'
    };
  }

  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const body = await res.arrayBuffer();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
      },
      body: Buffer.from(body).toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    return { statusCode: 500, body: `Proxy error: ${err.message}` };
  }
}
