# porkbun-bluesky-handles

<img width="772" alt="Screenshot 2025-06-25 at 10 03 19 pm" src="https://github.com/user-attachments/assets/7fe2b5d7-80bc-417c-ad62-ce115d016f45" />

_A simple way to offer custom Bluesky handles with Porkbun._

---

### How it works

This repo allows users to easily deploy their own Bluesky handle registrar — without the need to set up a database.

[Porkbun](https://porkbun.com/) provides an API to manage DNS records. This repo takes advantage of that API to avoid maintaining a separate database of handle names, instead appending them directly to Porkbun’s DNS records.

These records are managed through a simple Express server. The `/public` folder contains all the relevant HTML, CSS, and JavaScript, which can be easily customized.

---

### How to deploy

Set the following environment variables when deploying your site:

```
DOMAIN=your-domain.com (must be purchased via Porkbun)

API_KEY=your-porkbun-api-key
API_SECRET=your-porkbun-api-secret
```

You can generate the `API_KEY` and `API_SECRET` at: https://porkbun.com/account/api

You also have the option to deploy this app via Docker, depending on your preference.
