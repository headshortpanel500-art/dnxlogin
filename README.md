# dnxlogin — license backend for the FLC EXTREME panel

Next.js + MongoDB. Serves three audiences:

| Audience | Route | Auth |
|---|---|---|
| The injected cheat panel | `POST /api/validate-license/` | license key + HWID |
| The desktop app | `POST /api/login` | username/key + password + HWID |
| Admin dashboard | `/` | signed `admin_session` cookie |
| Reseller dashboard | `/reseller` | signed `reseller_session` cookie |

## Setup

```bash
npm install
cp .env.example .env.local     # then fill MONGODB_URI and SESSION_SECRET
npm run dev
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Create an account

```bash
node scripts/create-user.mjs <username> <password> [days] [devices] [key]
```

```bash
node scripts/create-user.mjs adi hunter2 365          # 365 days, 1 device
node scripts/create-user.mjs adi hunter2 30 2         # 30 days, 2 devices
node scripts/create-user.mjs adi hunter2 365 0        # unlimited devices
node scripts/create-user.mjs adi hunter2 365 1 ABCD-EFGH-JKMN-PQRS
```

Re-running it for an existing username renews the subscription, resets the
password, and rotates the key. The generated key is printed on the last three
lines — that is what the customer types into the panel.

Accounts created from the admin dashboard get a key automatically.

## API

### `POST /api/validate-license/`

What the injected panel (`flc_payload.dll`) sends:

```json
{ "key": "XXXX-XXXX-XXXX-XXXX", "hwid": "AABBCCDD..." }
```

Response shape is fixed. Every field is required, and `days_remaining` must be a
JSON number — the client reads it with `get<int>` and throws `0xE06D7363` on a
string.

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "days_remaining": 365,
  "expiry_date": "24/11/2027",
  "time_remaining_display": "365 dias",
  "username": "adi",
  "product": "FLC EXTREME",
  "sig": "d418ffb24a01162bd4ced1bf1b253f3f5219554cf6c1ac19cd426dd520251cb1"
}
```

Always returns HTTP 200. A 4xx/5xx makes the client print
`Erro no servidor (codigo: N)` instead of the message.

`sig` is a digest the client compares against a value it computes itself. The
algorithm is inside the packed DLL and is not reproduced here. The hook patches
that comparison out (`redirects=891A4:88BC4`), so the constant above is never
verified. Keep it 64 lowercase hex characters in case the redirect is dropped.

### `POST /api/login`

```json
{ "username": "adi", "password": "...", "hwid": "...", "version": "1.0.0" }
```

`key` may be sent instead of `username`. Version must match the
`requiredVersion` setting or the call returns 400 with `needsUpdate: true`.

### Everything else

All mutating admin routes require the `admin_session` cookie. All reseller
routes require the `reseller_session` cookie and only touch accounts whose
`createdBy` matches the cookie's subject.

| Route | Method | Auth |
|---|---|---|
| `/api/admin/login` | POST | — |
| `/api/admin/check-auth` | GET | admin |
| `/api/admin/logout` | POST | — |
| `/api/admin/settings` | GET, POST | admin |
| `/api/admin/reset-hwid` | POST | admin |
| `/api/admin/clear-hwids` | POST | admin |
| `/api/users` | GET, POST, PUT, DELETE | admin |
| `/api/resellers` | GET, POST, DELETE | admin |
| `/api/reseller/login` | POST | — |
| `/api/reseller/check-auth` | GET | reseller |
| `/api/reseller/logout` | POST | — |
| `/api/reseller/users` | GET, POST, PUT, DELETE | reseller |
| `/api/reseller/reset-hwid` | POST | reseller |
| `/api/reseller/clear-hwids` | POST | reseller |

## Notes

- **Passwords are bcrypt.** `lib/password.ts` accepts legacy plaintext rows and
  re-hashes them on the next successful login, so no forced reset is needed.
  Once every account has logged in at least once, the plaintext is gone.
- **Sessions are HMAC-signed.** `admin_session` used to be the literal string
  `authenticated_true`, which anyone could type into devtools. Tokens are now
  `<role>.<subject>.<expiry>.<hmac>` and are rejected without `SESSION_SECRET`.
- **License keys are unique and sparse.** `licenseKey` is `index: { unique:
  true, sparse: true }` so accounts without a key do not collide on `null`.
- **`sig` is not verified.** See above. If the redirect is ever removed from the
  hook, the panel will fail closed and `sig` must be computed for real.
- **HWID state is per-account.** `deviceLimit: 0` means unlimited. Resetting
  clears `registeredHwids` and the primary `hwid`.
