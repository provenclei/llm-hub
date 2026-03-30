# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible receiving such patches depend on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to **[security@llm-hub.com](mailto:security@llm-hub.com)**. You will receive a response from us within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity but historically within a few days.

Please include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the manifestation of the vulnerability
- Location of affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Measures

### API Security
- API keys are hashed before storage
- All API communications use HTTPS/TLS
- Rate limiting to prevent abuse
- Request signing and validation

### Data Protection
- Database encryption at rest
- Sensitive configuration encrypted
- Regular security audits
- No storage of user messages/content (only metadata)

### Infrastructure
- Docker containers run with minimal privileges
- Network isolation between services
- Regular dependency updates
- Automated vulnerability scanning

## Security Best Practices for Users

1. **Keep API keys secret** - Never expose your API keys in client-side code
2. **Use environment variables** - Store sensitive configuration in environment variables
3. **Rotate keys regularly** - Regenerate API keys periodically
4. **Monitor usage** - Regularly check your usage logs for anomalies
5. **Enable IP restrictions** - Restrict API access to specific IP addresses when possible
