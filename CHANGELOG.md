# Changelog

## [0.2.0] - 2025-01-17

### Added
- Claude Pro/Max subscription support via browser authentication
- Authentication method selection in credentials (Browser vs API Key)
- Browser profile configuration for multiple accounts
- API key override option for per-execution authentication changes
- Comprehensive authentication guide documentation
- `--use-browser` flag support for Claude Pro users

### Changed
- Default authentication method is now "browser" for Claude Pro users
- Credentials UI reorganized with conditional fields based on auth method
- Environment variable handling improved for different auth scenarios

### Fixed
- Command construction now properly handles browser authentication flags
- API key is only set in environment when using API key authentication

## [0.1.0] - 2025-01-17

### Added
- Initial release of n8n-nodes-claudecode
- Claude Code CLI integration with n8n
- Support for query, continue, and advanced operations
- Three output formats: Structured, JSON Lines, Plain Text
- Streaming JSON (JSONL) parsing
- Comprehensive error handling
- TypeScript implementation
- Full test suite
- Example workflows and documentation