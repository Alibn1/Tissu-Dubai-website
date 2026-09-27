This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app/turbopack).

## How this project works

**Two databases, on purpose.** The deployed Worker reads and writes Cloudflare D1
only. `npm run dev` reads the local SQLite file at `data/tissu.db`, which is also
the source used to seed D1. Nothing in the Worker falls back to in-memory state,
so if a page looks right locally and wrong in production, suspect the data rather
than the query.

**`data/tissu.db` is read-only input.** Do not edit it. Image extraction for R2
reads from it; the catalogue itself lives in D1.

**Secrets.** `ADMIN_PASSWORD` signs the admin session cookie and is required.
`ADMIN_API_KEY` is optional: setting it enables an `Authorization: Bearer` path
for scripts, and it doubles as the signing key if no password is set. Never commit
either value; they belong in `.dev.vars` locally and in Cloudflare as Worker
secrets.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server against `data/tissu.db` |
| `npm test` | Unit and component tests against a throwaway SQLite file |
| `npm run test:d1` | Integration test against the **real D1 database** |
| `npm run build` | Production build (OpenNext output) |
| `npm run preview` | Build and serve locally as a Worker |
| `npm run deploy` | Build and deploy to Cloudflare |
| `npm run db:reset` | Recreate the local SQLite file |

All of these need `NODE_OPTIONS=--experimental-sqlite`, which the scripts set for
you. Running `npx vitest` or `npx next` directly will fail with
`No such built-in module: node:sqlite`.

### `npm run test:d1` writes to production

This is not a read-only smoke test. It creates a product, updates it, deletes it,
and temporarily overwrites the contact address before restoring it. Two things to
know before running it:

- A run that fails part-way can leave a `TD-D1-VERIFY` product behind, and the
  next run then fails on the unique `reference` constraint. Delete it by hand
  before retrying.
- It asserts exact catalogue counts, so adding or removing a product in the admin
  will fail the first test. Those numbers are a deliberate check that the import
  landed correctly, which is why they are not relative.

## Windows: `.open-next` is locked

`workerd.exe` from a previous `npm run deploy` or `npm run preview` can survive the
build and hold the output directory, making the next build fail on a rename. Stop
it first:

```powershell
Get-Process workerd -ErrorAction SilentlyContinue | Stop-Process -Force
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
