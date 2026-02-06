# Mail setup (SMTP & IMAP)

This project uses **Hostinger** for sending (SMTP) and reading inbox (IMAP). Credentials are read from environment variables only.

## Hostinger server settings

| Protocol              | Host                  | Port | Encryption |
|-----------------------|------------------------|------|------------|
| **Incoming (IMAP)**   | `imap.hostinger.com`   | 993  | SSL        |
| Incoming (POP)        | `pop.hostinger.com`    | 995  | SSL        |
| **Outgoing (SMTP)**   | `smtp.hostinger.com`   | 465  | SSL        |

This app uses **IMAP** for inbox and **SMTP** for sending (ports 993 and 465).

## Environment variables

Copy `.env.local.example` to `.env.local` and set:

- `SMTP_HOST`, `SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- `IMAP_HOST`, `IMAP_PORT` (993), `IMAP_USER`, `IMAP_PASSWORD`

Never commit `.env` or `.env.local`; credentials stay server-side only.
