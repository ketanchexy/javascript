---
'@clerk/ui': patch
---

Keep the order the server sends for sign-in factors of the same strategy in the alternative methods list of `<SignIn />`. Previously, picking the starting factor reordered the sign-in's factors in place.
