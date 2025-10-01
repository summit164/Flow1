const https = require('https');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Создаем самоподписанный сертификат (только для разработки)
const httpsOptions = {
  key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
wEiOfH3nzor9cwHXLbkiG+2XgQXpM6EA4Ny3pEY+Sy23nnMAxc5rNWktbEHQKe5d
H1IR3G6NRmpzxwhPx4Ex9Mm8Qs9AiS+Oy2JGh/+g+SjMnB+2+vyLJFt+J8u5l+3n
nGjNjSunp5eM1RxYHv6x5Pc+2n4S8XQXpayubPfAObEjMUBuaungNnfpMmXDziQb
OKFz6BkGsSeJdzKhqkCTEOvdSD99tY5sRHytjPd0BQyai9WqKfMoKD0XEeVhM/7Q
YqQXe+UUOj5co3cSJKHe4Y1rgDxrcDAXDmrMqDzrbx3jhhaJ5r75+XpYa+zJOQsq
+BVLlSYNAgMBAAECggEBAK69rvKoUoQw1Z1pXwX6wMIoxmPGaGfRyflyxiKsi/3/
+CmtmUenUCMJT2Q1tiVw3q90gSAoAyBTDix6KDNfb8OfVzGbsHDcbkqWgmr0F0dH
tnzCqCz7lxcruKkpkwxk+29CjTLJe1+3q+U+k+2HZ2+6ozHCOdVkV9Rg+cjuzQoE
nLjy8IBfRk/g5/SJxVHiykCqV+mubwJuelGSnXHgLbzANBgcQlwP8r5M5M1+8/+B
s1zp5eI0kt9WQ+GJEEpXhMmBjVbcqfNN4+5h6EoUDmeUHPa2YgJI69jj5tbAFWtI
T+8jYiSOHhM8/QBiS+OmVKShpwuiuSyoA2jRM5M9J+ECgYEA3Oe2HdML7BcKkMdF
vVY/y6aGzFh5zVvztK2czKmRj13lHMyTlMcBucJGbJFOLMzQbr2VBcs2k8GJrHRa
4HFoLJ3LTnyRBdP8TR9/aIFyh1PoYQNrRlUDz14eMNiO73+jvEUBtHmStwhVBHfL
cCU0S2+Ql2jZyxJOlSHDHiK/AbMCgYEA1jyr1W5NdZKs+P9aNrBoXxlkMf4ywmAL
eLFGgQhoDu3NKVvqJdyMcw6ethFnspRUbJ8GxjxfkEIf7XDdvW0PtY+rygyKSFhz
XuVLi9YVmMpPtW5hf4GVv+l3wh8lGcHTA4U6Ip9Ox6Y6tQn25WQNcgHJmTQF8QFK
zEAuDPANBJsCgYB3ZAspUkOA5egqQhsDoHsb5liwrXJxkrwOZ7+0AaviVfKDWnuE
tiSBrfn9nxbsAI7QQKMoiLRJ+O/2mc1+Ja/9jGGG1B+FnNdabrJAqAS+0LhHFczI
cqnS6eFcOH/w1pfote3+oGWdgxULT2R+/rFXtdXd4Wdo/QhF+owTVrFoQwKBgEfz
T3VuorHfiQI9TkJn+z/VvRdXZeIFXgEYkXA1Q5rT7mfSXMzHBrUwjOUaTtAKsoIU
+ZbvU+1iMsRu5MlHdrAA8kDyZUBqk7L2Yl1atMWcgfEpwB0OxB0QxVV2+Vx+Vx+V
x+Vx+Vx+Vx+Vx+Vx+Vx+Vx+Vx+Vx+Vx+Vx+VxAoGAQNDdufANqA0I1+1ZQoU1+1Z
QoU1+1ZQoU1+1ZQoU1+1ZQoU1+1ZQoU1+1ZQoU1+1ZQoU1+1ZQoU1+1ZQoU1+1Z
QoU1+1ZQoU1+1ZQoU1+1ZQoU1+1ZQoU1+1ZQoU1+1ZQoU1+1ZQoU1+1ZQoU1+1Z
-----END PRIVATE KEY-----`,
  cert: `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAJC1HiIAZAiIMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTIwOTEyMjE1MjAyWhcNMTUwOTEyMjE1MjAyWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAu1SU1L7VLPHCgcBIjnx9586K/XMB1y25IhvtlYEF6TOhAODct6RGPkst
t55zAMXOazVpLWxB0CnuXR9SEdxujUZqc8cIT8eBMfTJvELPQIkvjstiRof/oPko
zJwftvr8iyRbfifLuZft55xozY0rp6eXjNUcWB7+seT3Ptp+EvF0F6Wsrmz3wDmx
IzFAbmrp4DZ36TJlw84kGzihc+gZBrEniXcyoapAkxDr3Ug/fbWObER8rYz3dAUM
movVqinzKCg9FxHlYTP+0GKkF3vlFDo+XKN3EiSh3uGNa4A8a3AwFw5qzKg8628d
44YWiea++fl6WGvsyTkLKvgVS5UmDQIDAQABo1AwTjAdBgNVHQ4EFgQUU3m/Wqor
Ss9UgOHYm8Cd8rIDZsswHwYDVR0jBBgwFoAUU3m/WqorSs9UgOHYm8Cd8rIDZssw
DAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQUFAAOCAQEAWiJfwU10iRdwU4UdXVGu
opQs8+tqnyygYszA4ZUk/tWnWjjr4ggZdToLmCOaVWBanffgwQAPdOOFXs0vkAZP
VFzZvymurQkmjw2ztLNiVBSyeQeqsZ/ZvBpbeJ4fBbKVgKoTdXuAhfGkaKy4fMmf
x3AJrQBk+Hqmo+vqez/Hr6Fy6sOkNjFHHFcWoWlqB3gaBXeqS1JUw0aUwHkDiLQN
bRfn5piKg/LWOqHZ7NDakfhZ4x0VqNQ6E4S+jCaIVFoBFvGWVRRVBnP9DjNn1K2I
0/EBVOWUiVKRuy0wB38XQQoQxVkjIXlIlVFJXaanuv0XpJjRRNnEuQIDAQABo1Aw
-----END CERTIFICATE-----`
};

const port = 3001;

app.prepare().then(() => {
  const server = https.createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`🔒 HTTPS сервер запущен на https://192.168.1.6:${port}`);
    console.log(`🌐 Локальный доступ: https://localhost:${port}`);
  });
});