# Ticket persistence hotfix

## Incident

The web API used an in-process ticket repository and customer map. A successful create response did not guarantee that another Netlify function instance could find the record. PostgreSQL connectivity alone did not prove that ticket writes used PostgreSQL.

## Required outcome

- A successful customer registration and ticket creation survives a new API process.
- Ticket search by phone, Vietnamese name or accent-free name reads the same persistent records as ticket details and updates.
- Existing branch restrictions, warranty approval, service consent and status transitions remain enforced.
- Ticket changes and their audit entries commit together; failed writes never return success.
- Concurrent requests for the same serial cannot create two open tickets.
- Handover evidence remains associated with the persistent ticket.

## Delivery gates

Use a separate PostgreSQL test instance for automated tests. Verify cross-process reads, concurrent serial conflicts, rollback on audit failure, branch isolation and existing API contracts before deployment. Apply only additive schema changes to production. Do not reset or reseed production customer data. Confirm the deployed build and API health after publishing.

## Tooling limitation

The repository has no `.specify/` scripts, templates or constitution. This incident document is a direct hotfix record, not a claim that the Spec Kit commands successfully ran.
