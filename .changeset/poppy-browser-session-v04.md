---
"@clerk/backend": minor
"@clerk/nextjs": minor
---

Add experimental support for Poppy 0.4 signed-in browser sessions with full account access. Enable the Clerk-defined `__experimental_poppy: true` option on `clerkMiddleware()` to publish Poppy and OAuth protected resource discovery on the application domain. Clerk hosts the browser session endpoint and uses its existing handshake to establish application cookies.

The Backend SDK checks current OAuth authority for agent-attributed Clerk session JWTs. Sign-out or revocation ends account access. Read authenticated agent attribution through `auth().agent`, including the Clerk-defined experimental fields `__experimental_poppyClientId`, `__experimental_poppyUserId`, and `__experimental_poppySessionId`. These fields describe Poppy protocol identity and may change while Poppy is draft. Signed-out visitors have no authenticated agent identity.

The session resolver and metadata helper are available through the Clerk-defined `clerkClient.__experimental_poppy` API.
