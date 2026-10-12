# Security boundaries

Passwords use Argon2 hashes and refresh tokens are stored as SHA-256 hashes with rotation and revocation. Access tokens are short-lived JWTs. Protected resources validate ownership at the API boundary.

The development execution adapter is a bounded subprocess with timeout and output limits, but it is not a production sandbox. Production must use a non-root, network-disabled container/worker with CPU, memory, PID, filesystem, and syscall restrictions. AI and speech credentials belong only in backend environment variables.
