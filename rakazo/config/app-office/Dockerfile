# CRD: Rakazo v0.1.6 web rebuilt with the Office-attachment hotfix (.xlsx/.docx/.pptx),
# so the upload button and client-side check accept Office files. Used by the web service only.
# Build context = rakazo/app-office/ (30-install-rakazo.sh step 5b copies the patched hotfix files there).
FROM ghcr.io/elie222/rakazo/app:v0.1.6
USER root
COPY contracts-attachments.ts /app/packages/contracts/src/attachments.ts
COPY core-attachments.ts /app/packages/core/src/attachments.ts
RUN cd /app && pnpm --filter @rakazo/web build \
 && grep -rlq spreadsheetml /app/apps/web/dist/assets
USER node
