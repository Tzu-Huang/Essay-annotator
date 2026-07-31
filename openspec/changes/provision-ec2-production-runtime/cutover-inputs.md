# Production Cutover Inputs

Recorded: 2026-07-31

| Input | Approved value |
| --- | --- |
| Production hostname | `essayannotator.com` |
| DNS provider / hosted zone | Amazon Route 53 public hosted zone `essayannotator.com` |
| Apex A record | `3.81.244.70` (Elastic IP allocation `eipalloc-0bdd9967cbd3c097d`) |
| Administrator SSH source | `60.251.43.140/32` |
| Maximum upload size | `25M` |
| Proxy timeout | `120` seconds |
| Backend production origin | `https://essayannotator.com` |

The SSH source is the operator's public IP at the time of approval. If the
operator network changes, update the Security Group through an authenticated AWS
session before removing the prior rule.

Secret values do not belong in this record. OpenAI and PostgreSQL credentials
remain scheduled for rotation before production cutover.
