# n8n-nodes-jobber

An [n8n](https://n8n.io/) community node for [Jobber](https://getjobber.com/) — field service management software for quoting, scheduling, invoicing, and CRM.

This node lets you automate Jobber workflows directly from n8n, including managing customers, creating jobs, and finding open schedule availability.

## Installation

### In n8n (recommended)

1. Go to **Settings > Community Nodes**
2. Enter `@salesai-prod/n8n-nodes-jobber`
3. Click **Install**

### Manual

```bash
cd ~/.n8n
npm install @salesai-prod/n8n-nodes-jobber
```

Restart n8n after installation.

## Credentials

This node uses **OAuth2** to authenticate with the Jobber API. You'll need a Jobber developer app:

1. Go to the [Jobber Developer Center](https://developer.getjobber.com/) and create an app
2. Copy your **Client ID** and **Client Secret**
3. In n8n, go to **Credentials > New Credential > Jobber OAuth2 API**
4. Enter your Client ID and Client Secret
5. Click **Connect** to complete the OAuth2 flow

### Required Scopes

The node requests the following scopes automatically:

- `read_clients` / `write_clients`
- `read_jobs` / `write_jobs`
- `read_schedule`

## Supported Operations

### Customer

| Operation | Description |
|-----------|-------------|
| **Get** | Retrieve a customer by ID |
| **Search** | Search customers by name, email, or phone |
| **Create** | Create a new customer with optional address, email, and phone |

### Job

| Operation | Description |
|-----------|-------------|
| **Get** | Retrieve a job by ID (includes line items, visits, assigned users) |
| **Create** | Create a job for a customer with optional line items and instructions |

### Schedule

| Operation | Description |
|-----------|-------------|
| **Get Availability** | Find open time slots in a date range based on existing jobs/visits |

The availability operation computes open slots by:
- Fetching all booked jobs and visits in the date range
- Generating candidate time slots based on configurable working hours and slot duration
- Returning slots that don't conflict with existing bookings
- Automatically skipping weekends

## Development

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
git clone https://github.com/salesai-prod/n8n-nodes-jobber.git
cd n8n-nodes-jobber
npm install
```

### Commands

```bash
npm run build          # Compile TypeScript and copy icons
npm run dev            # Watch mode for development
npm test               # Run tests
npm run test:coverage  # Run tests with coverage report
```

### Testing

The project uses Jest with ts-jest. Tests mock the n8n execution context and OAuth2 requests — no live Jobber credentials needed.

```bash
npm test
```

To test with a live n8n instance, link the package locally:

```bash
npm run build
npm link
cd ~/.n8n
npm link @salesai-prod/n8n-nodes-jobber
```

Restart n8n and the Jobber node will appear in the node picker.

### Project Structure

```
src/
  credentials/
    JobberOAuth2Api.credentials.ts   # OAuth2 credential definition
  nodes/Jobber/
    Jobber.node.ts                   # Node logic and execution
    JobberDescription.ts             # UI field definitions
    JobberGraphql.ts                 # GraphQL queries and mutations
    jobber.svg                       # Node icon
  __tests__/                         # Jest test suite
```

## API Reference

This node uses the [Jobber GraphQL API](https://developer.getjobber.com/docs/) (version `2025-01-20`).

## License

[MIT](LICENSE)
