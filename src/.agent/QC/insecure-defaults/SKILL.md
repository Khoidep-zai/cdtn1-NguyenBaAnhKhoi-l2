---
name: insecure-defaults
description: Detects fail-open security vulnerabilities where applications run insecurely due to missing or weak configuration. Focuses on distinguishing exploitable defaults (app runs with a weak secret) from fail-secure patterns (app crashes without proper config). Covers hardcoded credentials, weak crypto, permissive access controls, and debug features left enabled.
---

# Insecure Defaults Detection

Audits a codebase for insecure default configuration, tracing each candidate before reporting it.

## When to Use It

- Auditing JWT secret handling to catch fallback values like `|| 'default'` in production auth code
- Scanning Dockerfiles and IaC templates for missing environment variables that trigger insecure runtime behavior
- Reviewing environment variable handling to separate fail-open from fail-secure patterns before a deployment
- Checking crypto usage for MD5, SHA1, or ECB in password hashing and token signing contexts
- Tracing CORS wildcard and permission 0777 defaults to confirm whether they reach production endpoints

## Categories Checked
- Fallback secrets
- Default credentials
- Fail-open switches
- Weak crypto
- Permissive access
- Debug leakage
