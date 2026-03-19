# wp.lista-app.com backend deployment

This repository contains a Node.js backend (`server.js`) for support/contact forms.

The expected production app path is:

- `/var/www/wp.lista-app.com`

## Requirements

- Ubuntu with `systemd`
- Node.js 18+
- npm
- Nginx (for public reverse proxy)

## 1) Deploy code

```bash
sudo mkdir -p /var/www/wp.lista-app.com
sudo chown -R $USER:$USER /var/www/wp.lista-app.com
# copy or clone repository into /var/www/wp.lista-app.com
cd /var/www/wp.lista-app.com
npm install --omit=dev
```

## 2) Configure environment

Create `/etc/wp.lista-app.com.env` from `.env.production.example` values:

```bash
sudo tee /etc/wp.lista-app.com.env >/dev/null <<'EOF'
NODE_ENV=production
PORT=3000
SUPPORT_CRM_TIMEOUT_MS=20000
SUPPORT_FORWARD_TIMEOUT_MS=10000
SUPPORT_FORWARD_URL=http://localhost:8083/home/support-QzXp8v
CONTACT_US_FORWARD_URL=http://localhost:8083/home/leads-9rY3cq
ENABLE_TEMP_CORS=true
TEMP_CORS_ORIGIN=*
EOF
```

## 3) Install and start systemd service

```bash
sudo cp /var/www/wp.lista-app.com/deploy/systemd/wp.lista-app.com.service /etc/systemd/system/wp.lista-app.com.service
sudo systemctl daemon-reload
sudo systemctl enable wp.lista-app.com
sudo systemctl start wp.lista-app.com
sudo systemctl status wp.lista-app.com
```

## 4) Configure Nginx route

Use `deploy/nginx/wp.lista-app.com.conf` as a template and merge its `location` blocks into your existing API vhost.

Then validate and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5) Health check

```bash
curl -i http://127.0.0.1:8083/healthz-gn5bre
curl -i https://wp.lista-app.com/lst/healthz-gn5bre
```

## 6) API request logs

The backend now logs each API request to stdout with:

- `requestId`
- HTTP method and path
- response status
- request duration (`duration_ms`)
- client IP (`ip`)
- user agent

Since the app runs with `systemd`, watch logs in real time:

```bash
sudo journalctl -u wp.lista-app.com -f
```

Control logging with env vars in `/etc/wp.lista-app.com.env`:

```ini
REQUEST_LOGGING_ENABLED=true
REQUEST_LOG_EXCLUDE_HEALTHCHECKS=true
```

## Notes

- Keep `support.curl` and `contact_us.curl` alongside `server.js`.
- If browser requests are cross-origin, keep `ENABLE_TEMP_CORS=true` and set `TEMP_CORS_ORIGIN` to your site domain.
