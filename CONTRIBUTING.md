# Contributing

Thanks for helping improve the Jobber community node for n8n.

## Before You Start

- Open an issue for larger changes so the approach can be discussed first.
- Keep pull requests focused on one bug fix or feature.
- Do not include Jobber access tokens, client secrets, customer data, or other sensitive information in issues, tests, screenshots, or logs.

## Development Setup

Use a Node.js version supported by this package:

```bash
nvm use
npm install
```

Run the checks before opening a pull request:

```bash
npm run lint
npm test
npm run build
npm audit
```

## Testing in n8n

Package the node and install it into a local n8n user folder:

```bash
npm pack
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install /path/to/n8n-nodes-jobber/salesai-prod-n8n-nodes-jobber-0.1.0.tgz
```

Restart n8n and confirm the Jobber node appears in the node picker.

## Pull Requests

Include:

- What changed and why
- Any Jobber API behavior or n8n compatibility concerns
- The checks you ran
- Screenshots only when the n8n UI changed

## Security Issues

Do not report vulnerabilities in public issues. Use GitHub private vulnerability reporting, or see [SECURITY.md](SECURITY.md).
