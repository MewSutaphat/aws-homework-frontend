---
name: s3-deploy-github-actions
description: |
  Use this skill whenever the user wants to set up automatic deployment to AWS S3 via GitHub Actions.
  Trigger this skill when the user mentions: deploy to S3, S3 hosting, static site deployment,
  GitHub Actions deploy, push to develop auto-deploy, AWS S3 workflow, CI/CD to S3,
  CloudFront invalidation after deploy, AWS credentials in GitHub secrets, or S3 bucket sync.

  This skill produces a complete, ready-to-use GitHub Actions workflow that:
  - Triggers on push to the `develop` branch
  - Verifies AWS credentials and S3 bucket configuration before deploying
  - Builds the frontend project (Vite / CRA / Next.js static export)
  - Syncs output to S3 with correct cache headers
  - Optionally invalidates a CloudFront distribution
  - Validates all required GitHub Secrets are present
---

# S3 Deploy via GitHub Actions Skill

This skill sets up automatic deployment of a static frontend to **AWS S3** every time code is pushed to the `develop` branch. Authentication uses **AWS Access Key + Secret** stored as GitHub Secrets.

## Pre-Flight Checklist

Before generating workflow files, verify or ask the user for:

| Item | Where to find |
|------|---------------|
| S3 bucket name | AWS Console → S3 |
| AWS region | e.g. `ap-southeast-1` |
| Build output directory | e.g. `dist/`, `out/`, `build/` |
| Build command | e.g. `npm run build` |
| CloudFront distribution ID | AWS Console → CloudFront (optional) |
| GitHub Secrets set? | Repo → Settings → Secrets → Actions |

If any item is unknown, tell the user what's needed and where to find it — don't guess.

## Required GitHub Secrets

The user must add these in **Repo → Settings → Secrets and variables → Actions → New repository secret**:

```
AWS_ACCESS_KEY_ID       ← IAM user's access key ID
AWS_SECRET_ACCESS_KEY   ← IAM user's secret access key
AWS_REGION              ← e.g. ap-southeast-1
S3_BUCKET_NAME          ← e.g. my-app-develop
CLOUDFRONT_DIST_ID      ← (optional) e.g. E1ABCDEF123456
```

## AWS IAM Policy Required

The IAM user needs this minimum policy (share with the user if they ask):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::*:distribution/YOUR-DIST-ID"
    }
  ]
}
```

## Workflow Template

Generate `.github/workflows/deploy-develop.yml`:

```yaml
name: Deploy to S3 (develop)

on:
  push:
    branches:
      - develop

env:
  NODE_VERSION: '20'

jobs:
  verify-and-deploy:
    name: Verify AWS Config & Deploy
    runs-on: ubuntu-latest

    steps:
      # ── 1. Checkout ───────────────────────────────────────────────────────
      - name: Checkout repository
        uses: actions/checkout@v4

      # ── 2. Verify required secrets are present ────────────────────────────
      - name: Verify required secrets
        run: |
          missing=()
          [[ -z "${{ secrets.AWS_ACCESS_KEY_ID }}" ]]       && missing+=("AWS_ACCESS_KEY_ID")
          [[ -z "${{ secrets.AWS_SECRET_ACCESS_KEY }}" ]]   && missing+=("AWS_SECRET_ACCESS_KEY")
          [[ -z "${{ secrets.AWS_REGION }}" ]]              && missing+=("AWS_REGION")
          [[ -z "${{ secrets.S3_BUCKET_NAME }}" ]]          && missing+=("S3_BUCKET_NAME")
          if [ ${#missing[@]} -gt 0 ]; then
            echo "❌ Missing GitHub Secrets: ${missing[*]}"
            echo "Add them at: Repo → Settings → Secrets and variables → Actions"
            exit 1
          fi
          echo "✅ All required secrets are present"

      # ── 3. Configure AWS credentials ──────────────────────────────────────
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      # ── 4. Verify AWS authentication & S3 bucket access ───────────────────
      - name: Verify AWS auth and S3 bucket access
        run: |
          echo "🔍 Verifying AWS identity..."
          aws sts get-caller-identity

          echo "🔍 Checking S3 bucket access..."
          if aws s3 ls "s3://${{ secrets.S3_BUCKET_NAME }}" > /dev/null 2>&1; then
            echo "✅ S3 bucket '${{ secrets.S3_BUCKET_NAME }}' is accessible"
          else
            echo "❌ Cannot access S3 bucket '${{ secrets.S3_BUCKET_NAME }}'"
            echo "Check: bucket exists, correct region, IAM permissions"
            exit 1
          fi

      # ── 5. Setup Node.js ──────────────────────────────────────────────────
      - name: Setup Node.js ${{ env.NODE_VERSION }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      # ── 6. Install dependencies ───────────────────────────────────────────
      - name: Install dependencies
        run: npm ci

      # ── 7. Build ──────────────────────────────────────────────────────────
      - name: Build project
        run: npm run build
        env:
          # Pass any build-time env vars here, e.g.:
          # VITE_API_URL: ${{ secrets.VITE_API_URL }}
          NODE_ENV: production

      # ── 8. Verify build output exists ─────────────────────────────────────
      - name: Verify build output
        run: |
          BUILD_DIR="dist"  # ← Change to your build output dir (dist, out, build)
          if [ ! -d "$BUILD_DIR" ] || [ -z "$(ls -A $BUILD_DIR)" ]; then
            echo "❌ Build output directory '$BUILD_DIR' is empty or missing"
            exit 1
          fi
          echo "✅ Build output verified ($(du -sh $BUILD_DIR | cut -f1) total)"
          ls -la "$BUILD_DIR"

      # ── 9. Deploy to S3 ───────────────────────────────────────────────────
      - name: Deploy to S3
        run: |
          BUILD_DIR="dist"  # ← Must match step 8
          echo "🚀 Syncing to s3://${{ secrets.S3_BUCKET_NAME }}..."

          # Sync HTML files with no-cache (always revalidated)
          aws s3 sync "$BUILD_DIR" "s3://${{ secrets.S3_BUCKET_NAME }}" \
            --exclude "*" \
            --include "*.html" \
            --cache-control "no-cache, no-store, must-revalidate" \
            --delete

          # Sync assets with 1-year cache (content-hashed by build tool)
          aws s3 sync "$BUILD_DIR" "s3://${{ secrets.S3_BUCKET_NAME }}" \
            --exclude "*.html" \
            --cache-control "public, max-age=31536000, immutable" \
            --delete

          echo "✅ Deploy complete"

      # ── 10. Invalidate CloudFront (optional) ──────────────────────────────
      - name: Invalidate CloudFront cache
        if: ${{ secrets.CLOUDFRONT_DIST_ID != '' }}
        run: |
          echo "🔄 Invalidating CloudFront distribution ${{ secrets.CLOUDFRONT_DIST_ID }}..."
          aws cloudfront create-invalidation \
            --distribution-id "${{ secrets.CLOUDFRONT_DIST_ID }}" \
            --paths "/*"
          echo "✅ CloudFront invalidation triggered"

      # ── 11. Summary ───────────────────────────────────────────────────────
      - name: Deployment summary
        if: success()
        run: |
          echo "## 🎉 Deployment Successful" >> $GITHUB_STEP_SUMMARY
          echo "- **Branch**: \`develop\`" >> $GITHUB_STEP_SUMMARY
          echo "- **Bucket**: \`s3://${{ secrets.S3_BUCKET_NAME }}\`" >> $GITHUB_STEP_SUMMARY
          echo "- **Region**: \`${{ secrets.AWS_REGION }}\`" >> $GITHUB_STEP_SUMMARY
          echo "- **Commit**: \`${{ github.sha }}\`" >> $GITHUB_STEP_SUMMARY
```

## S3 Bucket Configuration

The user also needs to configure the S3 bucket for static website hosting. Give them these steps:

1. **Enable static website hosting**:
   - AWS Console → S3 → Your bucket → Properties → Static website hosting
   - Index document: `index.html`
   - Error document: `index.html` (for SPA routing)

2. **Bucket policy** (if hosting publicly without CloudFront):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
  }]
}
```

3. **Disable Block Public Access** if serving publicly.

4. **If using CloudFront** (recommended for production): Keep Block Public Access ON, use Origin Access Control (OAC) instead.

## AWS Config Check Script (Local)

If the user wants to verify their local AWS config before setting up GitHub Secrets, provide this script:

```bash
#!/bin/bash
# check-aws-config.sh — Run locally to verify AWS credentials
set -e

BUCKET="${1:-}"  # Pass bucket name as argument: ./check-aws-config.sh my-bucket

echo "=== AWS Config Check ==="
echo ""

echo "1. Checking AWS CLI installation..."
aws --version || { echo "❌ AWS CLI not installed. Install from https://aws.amazon.com/cli/"; exit 1; }
echo "✅ AWS CLI installed"
echo ""

echo "2. Checking AWS credentials..."
aws sts get-caller-identity && echo "✅ Credentials valid" || { echo "❌ Invalid credentials. Run: aws configure"; exit 1; }
echo ""

echo "3. Checking AWS region..."
REGION=$(aws configure get region)
echo "✅ Region: $REGION"
echo ""

if [ -n "$BUCKET" ]; then
  echo "4. Checking S3 bucket access: $BUCKET"
  aws s3 ls "s3://$BUCKET" && echo "✅ Bucket accessible" || echo "❌ Cannot access bucket"
  echo ""
fi

echo "=== Config Check Complete ==="
```

## Customization Points

Tell the user about these common customizations:

- **Different branch**: Change `branches: [develop]` to `[main]`, `[staging]`, or add multiple
- **Path filters**: Add `paths: ['src/**', 'public/**']` under `on.push` to skip deploys on doc changes
- **Environment variables**: Add them in the Build step under `env:`
- **Build directory**: Change `BUILD_DIR="dist"` in steps 8 and 9 to match your project (`out` for Next.js, `build` for CRA)
- **Node version**: Change `NODE_VERSION: '20'` to match your project

## Verification Sub-Agent

After generating the workflow, spawn a verification sub-agent:

```
Review the GitHub Actions workflow YAML I just generated. Check:
1. Does it verify required GitHub Secrets before running any AWS commands?
2. Does it use `aws sts get-caller-identity` to verify authentication?
3. Does it check S3 bucket accessibility before deploying?
4. Does it handle build failure gracefully (exit 1 if build dir is empty)?
5. Does HTML use no-cache and assets use immutable cache headers?
6. Is CloudFront invalidation conditional (only runs if the secret is set)?
7. Are all hardcoded values (bucket names, regions) using ${{ secrets.* }}?

Report PASS or FAIL for each with a one-line explanation.
```
