# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-17

### Added
- Initial release of the Jobber n8n community node
- OAuth2 authentication via Jobber API
- **Customer** resource: Get, Search, Create operations
- **Job** resource: Get, Create operations
- **Schedule** resource: Get Availability operation with configurable working hours and slot duration
- `usableAsTool` support for n8n AI agent workflows

### Changed
- Use Jobber GraphQL API version `2025-04-16`
- Align supported Node.js versions with current n8n runtime support
