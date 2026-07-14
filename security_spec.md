# Security Specification

## 1. Data Invariants
- **Events**: Only authenticated administrator users (`admin@uii.ac.id` or `236102601@uii.ac.id`) can create or update event documents. Non-admins have read-only access to events to view details and registration deadlines.
- **Participants**: Any user can submit a registration (create a participant) if registration is open and deadline has not passed. Each participant must have a valid `id` starting with "IKA-", must consent to the data policy, and cannot modify their registration ID once created. Only administrators can perform manual check-ins, cancel check-ins, or delete registrations.
- **Audit Logs**: Automatically created whenever administration changes happen. Only admins can view the logs. Writes are restricted to valid schema formats.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Identity Spoofing (Owner Hijack)**: Registering a participant with a spoofed `id` or mismatching author identifier.
2. **Ghost Field (Shadow Update)**: Updating a participant with a hidden privileged field like `checkedIn: true` during registration.
3. **Admin Privilege Escalation**: Attempting to write an Event configuration with a standard non-admin account or unauthenticated.
4. **Denial of Wallet (Huge String ID)**: Registering or querying a document with a 2MB ID string to cause database performance or storage exhaustion.
5. **Orphaned Registration**: Creating a participant record with a non-existent `eventId`.
6. **State-Skipping (Check-In Spoof)**: Writing a manual check-in status directly from the client.
7. **Invalid Type Injection**: Writing `phone` as a boolean, or `consent` as a string instead of boolean.
8. **Out of Boundary Size**: Injecting a name of 10,000 characters or negative values.
9. **Duplicate Registration Bypass**: Attempting to bypass the unique phone constraint by writing multiple records with same metadata.
10. **Timestamp Fraud**: Setting `createdAt` or `checkedInAt` to a historical or future timestamp instead of `request.time`.
11. **Bypassing Deadline**: Attempting to register after the Event's `registrationDeadline` is passed.
12. **PII Exposure (Data Harvesting)**: Unauthenticated listing of all participant names, phone numbers, and emails.

---

## 3. Test Cases Spec for Rules Validation
All of the above payloads must return `PERMISSION_DENIED` under the generated rules.
