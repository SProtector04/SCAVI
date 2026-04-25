Genera aquí los certificados TLS para Nginx.

Ejemplo con OpenSSL:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/scavi.key \
  -out certs/scavi.crt \
  -subj "/CN=10.104.99.123"
```

Luego reinicia `docker compose up --build`.
