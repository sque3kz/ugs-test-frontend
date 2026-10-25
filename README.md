# Universal Gym – test version (frontend only)

A preview of the public website for the owner and the trainers to check the texts and photos:
the homepage and the trainer pages, in all three languages.

It has no backend: no login, no registration, no account menu, no API calls.
The homepage plans are written into `build.py` (`PLANS`). Links to registration, login and the
member portal only show a "this is a test version" message.

## Update after changing the real site

```sh
python3 build.py      # copies ../universalgym into docs/
```

Add a new trainer page to `PAGES` in `build.py` first. Change `PLANS` when the plans change.

## Publish on GitHub Pages

1. Create a new repository on GitHub (e.g. `ugs-test-frontend`) and push this folder.
2. Repository → Settings → Pages → Source: *Deploy from a branch*, Branch: `main`, folder: `/docs`.
3. The site is at `https://<user>.github.io/ugs-test-frontend/`.

Pages have `noindex`, so search engines leave the test site alone.
