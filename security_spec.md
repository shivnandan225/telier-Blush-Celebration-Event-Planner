# Security Specification & Hardened Rules Audit

## 1. Data Invariants

1. **Event Ownership Integrity**: An event document in `/events/{eventId}` must always belong to `request.auth.uid` on creation, and `ownerId` is immutable thereafter.
2. **Master Gate Relational Sync**: A `budgetItem` or `rsvp` under `/events/{eventId}` cannot exist without an existing parent event at `/events/{eventId}`, and organizer mutations require matching `ownerId == get(/events/{eventId}).data.ownerId == request.auth.uid`.
3. **PII Isolation**: Guest emails (`guestEmail`) and full RSVP lists (`list` on `rsvps`) are strictly isolated to the authenticated event owner. Public invitation visitors may only `get` a single event document when `isPublicRsvp == true` and `create` a single RSVP record without reading any other guest records.
4. **Temporal & Volumetric Integrity**: All `createdAt` and `updatedAt` timestamps must match `request.time`; all IDs must match `^[a-zA-Z0-9_\-]+$` (max 64/128 chars); all strings, numbers, and bounded arrays (`costSavingTips.size() <= 10`) are strictly validated.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)

1. **Identity Spoofing on Event Create**: Creating `/events/evt1` with `ownerId: "victim-uid"` when signed in as `"attacker-uid"`.
2. **Unverified Email Write**: Creating an event or budget item when `request.auth.token.email_verified == false`.
3. **Shadow Field Injection**: Updating `/events/evt1` with an extra undeclared key `isAdminOverride: true`.
4. **Immutable Owner Tampering**: Updating `/events/evt1` to reassign `ownerId` to another UID.
5. **Fake Timestamp Injection**: Creating a budget item with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`.
6. **ID Poisoning**: Creating `/events/<1500-char-id>` or using invalid path characters (`$`, `.`, spaces).
7. **Orphaned Budget Item**: Creating `/events/nonexistent_evt/budgetItems/b1` where the parent event does not exist.
8. **Cross-Tenant List Scraping**: Querying `/events` or `rsvps` without `where('ownerId', '==', request.auth.uid)` or trying to `list` all `/events` publicly.
9. **Public RSVP List Enumeration (PII Leak)**: Unauthenticated or non-owner user attempting `list` or `get` on `/events/evt1/rsvps`.
10. **Closed RSVP Injection**: Submitting a public RSVP (`create`) to `/events/evt1/rsvps/r1` when `isPublicRsvp == false`.
11. **Owner Spoof in Public RSVP**: Submitting a public RSVP with `ownerId` set to an arbitrary UID not matching the parent event's `ownerId`.
12. **Array & String Resource Exhaustion**: Writing `costSavingTips` with 50 items or a 50KB `notes` string.
