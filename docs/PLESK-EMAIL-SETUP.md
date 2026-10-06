# Plesk form email setup

All three forms (contact, Load Calculator, Partner With Us) use our own PHP endpoints and authenticated SMTP. No EmailJS or Microsoft Graph setup is needed.

## Mail connection

| Setting | Value |
| --- | --- |
| SMTP server | `eastmanpowersolutions.in` |
| Port | `465` |
| Encryption | Implicit TLS (SMTPS) |
| Username / From | `no-reply@eastmanpowersolutions.in` |
| To | `marketing@eaplworld.com` |
| Reply-To | Visitor's validated email address |

These addresses and connection settings are fixed in `api/mail-lib.php`. Visitors cannot change the sender or recipient. The mailbox password is stored only in the private server configuration.

## Requirements

- Plesk with PHP 8.1+, sessions, JSON, and cURL with the `smtps` protocol enabled. Check `curl_version()['protocols']` or ask the hosting provider to confirm SMTP support in PHP cURL.
- HTTPS for the website and outbound access to `eastmanpowersolutions.in:465` from PHP.
- The existing `no-reply@eastmanpowersolutions.in` mailbox password.
- A valid mail-server TLS certificate covering `eastmanpowersolutions.in`. Certificate checks remain enabled. If the hosting provider specifies another certified mail hostname, update the SMTP URL to that hostname; do not disable verification.
- No email-service subscription is added. Existing hosting fees and Plesk outgoing-mail quotas still apply.

## Install on Plesk

1. Upload the updated site into `httpdocs/web`, including `api/`, the updated JavaScript files, `js/email-config.js`, calculator scripts, and the form/captcha markup and styles. PHP files must execute, never be served as source. Static hosting such as GitHub Pages cannot run these endpoints.
2. In **Domains → PHP Settings**, select PHP 8.1+ and confirm cURL/session support. Keep `display_errors` off in production.
3. Outside `httpdocs`, create `private/eapl-mail-config.php` using `docs/eapl-mail-config.example.php`. A typical path is `/var/www/vhosts/eastmanpowersolutions.in/private/eapl-mail-config.php`. Only the domain's PHP process should be able to read it. Do not place credentials in `httpdocs`, browser JavaScript, Git, or deployment ZIP files.
4. Fill in the mailbox password directly on the server. For your `httpdocs/web` website, the backend reads `Home directory/private/eapl-mail-config.php` by default; if the upload location changes, set the PHP environment variable `EAPL_MAIL_CONFIG` to the absolute private config path.
5. Ensure `open_basedir` permits reading that private file and PHP can write sessions and a private rate-limit directory under its system temp directory. Rate-limit records contain timestamps and a hashed IP/site key, not submitted form contents. Use a daily Plesk scheduled cleanup for rate-limit files older than 24 hours. The rate limiter assumes one hosting server/shared temp storage.
6. Apache denies access to the helper and data files via `api/.htaccess`. If Plesk serves these through nginx directly, add equivalent nginx restrictions for `/api/mail-lib.php` and `/api/calculator-data.json`. The data file contains public product data, no passwords.
7. Open each form, ensure a captcha loads, submit a test with an address you control, and check Marketing's inbox and Plesk's mail logs. Test an incorrect answer too. **No production email has been sent as part of development.**

## Domain delivery settings

In Plesk, ensure mail is enabled for this domain and check SPF and DKIM signing. These help the receiving Microsoft 365 mailbox authenticate the sender. If mail is rejected or goes to spam, ask the hosting provider to check SPF, DKIM, reverse DNS and mail logs. Keep `marketing@eaplworld.com` as the recipient; no administrator access to that inbox is needed to send to it.

## Behaviour and troubleshooting

- Captchas expire after 10 minutes, allow five answer attempts, and are consumed before sending to prevent replay. A refresh button obtains a new question. Browser previews without PHP show a verification-unavailable message rather than bypassing it.
- The API permits 10 submission attempts per IP per 15 minutes and 60 captcha requests per 10 minutes. It ignores visitor-controlled forwarded-IP headers. If Plesk is behind a proxy, configure trusted real-client-IP handling at the web server.
- Required fields, field sizes, phone/PIN/email formats, and dropdown values are validated again on the server. Only supported fields are mailed. The calculator backend calculates load/product results from appliance IDs and quantities; browser-provided recommendation text is not trusted. Its data snapshot is `api/calculator-data.json`: update it alongside `js/calculator-data.js` whenever product data changes.
- Mathematical verification is basic spam friction, not complete bot protection. Server verification and rate limiting prevent simply bypassing the browser checks, but automated programs can still solve arithmetic.
- Missing configuration or a SMTP error returns a generic failure to visitors. Logs contain exception classes only, never passwords or enquiry contents. Check the configuration, mailbox password, authentication settings, TLS certificate, outbound port 465 access, sessions and PHP error logs.
- SMTP acceptance means the server queued the email, not that delivery to Marketing is confirmed. Check Marketing's inbox/spam and Plesk's mail logs. SMTP sending does not normally create a Sent Items copy. Do not automatically retry uncertain sends, as that can duplicate emails.

## Local checks

Run `php tests/mail-backend.test.php` for field validation, captcha lifecycle and server calculation checks. Run `node --test tests/calculator-logic.test.cjs` for calculator logic. For a PHP-enabled preview, run `php -S 127.0.0.1:5501 -t .`. With no mailbox password, captcha and validation work but sending fails safely. Run `npm install` once, then `npm run serve` and open **http://localhost:8082/** for a PHP-enabled local preview. It uses installed PHP when available, otherwise the development-only PHP WebAssembly runtime. No mailbox password is needed for captcha testing. Use `npm run serve -- --port 8081` only after stopping the static server already occupying port 8081. VS Code Go Live, Python's static server, and `npm run serve:static` do not execute PHP and cannot run the captcha endpoints. This preview is local-only; Plesk uses its own PHP installation.
