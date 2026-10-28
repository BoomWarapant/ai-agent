# CRD: Rakazo v0.1.6 web rebuilt with CRD hotfixes. Used by the web service only.
# - Office attachments (.xlsx/.docx/.pptx): upload button and client-side check accept Office files
# - Role-specific robot cat avatars (bot-avatar.tsx robot variant + existing motion styles)
# - crd-bot branding: window title / web app name "crd-bot", crd-bot favicons (branding/), and the word
#   "Rakazo" in visible UI text (web pages + all locale catalogs, so translations still match).
#   Only the capitalised whole word is replaced; lowercase internal ids (rakazo.* keys, classes) are untouched.
# Build context = rakazo/app-office/ (30-install-rakazo.sh step 5b copies the patched files there).
FROM ghcr.io/elie222/rakazo/app:v0.1.6@sha256:fb60c6eeed892395f586794928ac8625f1a9553768095f30116d3eb9bd2b5e9a
USER root
COPY hotfix/contracts-attachments.ts /app/packages/contracts/src/attachments.ts
COPY hotfix/core-attachments.ts /app/packages/core/src/attachments.ts
COPY bot-avatar.tsx /app/packages/ui-web/src/bot-avatar.tsx
COPY styles.css /app/packages/ui-web/src/styles.css
COPY branding/ /app/apps/web/public/
COPY hotfix/web-ssrf.ts hotfix/keyless-http-web.ts hotfix/undici-fetch.ts hotfix/remote-mcp.ts /app/packages/adapters/src/
COPY crd-team.ts team-bots.json /app/packages/db/src/
COPY prepare.mjs /tmp/crd-prepare.mjs
RUN node /tmp/crd-prepare.mjs
RUN sed -i 's#<title>Rakazo</title>#<title>crd-bot</title>#; s#content="Rakazo"#content="crd-bot"#; s#href="/favicon.ico"#href="/favicon.ico?v=neo-cat-20261029"#; s#href="/favicon.svg"#href="/favicon.svg?v=neo-cat-20261029"#; s#href="/apple-touch-icon.png"#href="/apple-touch-icon.png?v=neo-cat-20261029"#; s#href="/site.webmanifest"#href="/site.webmanifest?v=neo-cat-20261029"#' /app/apps/web/index.html \
 && sed -i 's#"name": "Rakazo"#"name": "crd-bot"#; s#"short_name": "Rakazo"#"short_name": "crd-bot"#' /app/apps/web/public/site.webmanifest \
 && grep -q '<title>crd-bot</title>' /app/apps/web/index.html \
 && grep -q '"short_name": "crd-bot"' /app/apps/web/public/site.webmanifest \
 && cd /app \
 && grep -rlw Rakazo apps/web/src packages/ui-web/src --include=*.tsx --include=*.po | xargs sed -i -E 's/\bRakazo\b/crd-bot/g' \
 && ! grep -rqw Rakazo apps/web/src packages/ui-web/src --include=*.tsx --include=*.po \
 && pnpm --filter @rakazo/web build \
 && grep -rlq spreadsheetml /app/apps/web/dist/assets \
 && grep -rlq rakazo-hh /app/apps/web/dist/assets \
 && grep -q '<title>crd-bot</title>' /app/apps/web/dist/index.html
USER node
