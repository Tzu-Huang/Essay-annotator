# Production deployment trust and configuration

This document is the non-secret configuration contract for the production deployment path. Do not put credentials, database URLs, GitHub tokens, signed URLs, or private keys in this file or in GitHub variables.

## Production values

Replace every `CHANGE_ME` before enabling the deployment job. Store these as GitHub Environment variables on the protected `production` environment, not as repository secrets.

| Variable | Value | Purpose |
| --- | --- | --- |
| `AWS_ACCOUNT_ID` | `814322375571` | Twelve-digit production AWS account ID (record only; not a workflow variable) |
| `PRODUCTION_AWS_REGION` | `us-east-1` | Region containing the release bucket and EC2 instance |
| `PRODUCTION_RELEASE_BUCKET` | `essay-annotator-production-releases-814322375571` | Private S3 bucket for release artifacts |
| `PRODUCTION_RELEASE_PREFIX` | `essay-annotator/production/releases` | Prefix containing commit-addressed artifacts and checksums |
| `PRODUCTION_INSTANCE_ID` | `i-02872a5190a894a64` | One managed production EC2 instance |
| `PRODUCTION_PUBLIC_BASE_URL` | `https://essayannotator.com` | Public HTTPS origin used by smoke checks |
| `PRODUCTION_DEPLOY_ROLE_ARN` | `arn:aws:iam::814322375571:role/EssayAnnotatorGitHubProductionDeploy` | GitHub OIDC deployment role ARN |
| `PRODUCTION_SSM_DOCUMENT_NAME` | `EssayAnnotatorDeploy` | Fixed custom SSM document allowed by the deploy policy |
| `SSM_COMMAND_PATH` | `/usr/local/sbin/essay-annotator-deploy` | Fixed root-managed command invoked by the SSM document |
| `GITHUB_REQUIRED_REVIEWERS` | `CHANGE_ME` | GitHub users or team permitted to approve production |
| `HOST_AUDIT_RETENTION_DAYS` | `90` | Required retention for host JSONL audit records |
| `GITHUB_ARTIFACT_RETENTION_DAYS` | `30` | Workflow artifact/evidence retention |

The repository and environment identity are fixed as `Tzu-Huang/Essay-annotator` and `production`. Release object keys must remain beneath `${RELEASE_PREFIX}/<full-lowercase-commit-sha>/`; the artifact and checksum use that same immutable SHA identity.

## AWS trust installation

1. Add the GitHub OIDC provider `https://token.actions.githubusercontent.com` to the production AWS account with audience `sts.amazonaws.com`.
2. Substitute the documented values into `deploy/iam/github-production-oidc-trust.json.template` and use it as the deploy role trust policy. Its subject permits only jobs attached to this repository's `production` Environment.
3. Attach the rendered `deploy/iam/github-production-deploy-policy.json.template` to that role. It permits release-prefix object transfer and invocation of only the named SSM document on the named instance. The command-result read actions use `Resource: *` because those Systems Manager actions do not support resource-level permissions.
4. Attach AWS managed policy `arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore` and the rendered `deploy/iam/ec2-production-release-read-policy.json.template` to the EC2 instance role. Do not grant the instance `s3:PutObject` or bucket-wide object reads.
5. Render and install `deploy/iam/essay-annotator-deploy-ssm-document.json.template` under `SSM_DOCUMENT_NAME`. Its only deployment action executes `SSM_COMMAND_PATH`; it does not accept a caller-supplied executable path or arbitrary shell command. Parameters carry only constrained deployment identifiers, artifact identity, digest, actor, and trigger metadata.

If the S3 bucket uses a customer-managed KMS key, separately grant both roles only the required key operations for this bucket. No KMS grant is required for SSE-S3.

## Protected GitHub Environment

In repository **Settings > Environments**, create or open `production` and configure:

1. Add the people or team recorded in `GITHUB_REQUIRED_REVIEWERS` to **Required reviewers** and enable the option that prevents an initiator from approving their own deployment.
2. Limit deployment branches/tags to selected branches and add only `main`.
3. Add the non-secret variables from the table. Do not add long-lived AWS access keys or an SSH private key.
4. Set artifact/log retention to the recorded policy, ensuring it is at least `GITHUB_ARTIFACT_RETENTION_DAYS`; configure host audit rotation for `HOST_AUDIT_RETENTION_DAYS` without applying release cleanup to audit records.

Repository administrators must capture dated evidence of the required-reviewer list, `main` branch restriction, environment variables (names and non-secret values only), AWS role policy versions, SSM managed-instance status, and retention settings. Store that evidence with the controlled production proof; do not commit screenshots containing secrets.

## Preflight verification

Run these read-only checks before any command that can activate a release:

```text
aws sts get-caller-identity
aws ssm describe-instance-information --filters Key=InstanceIds,Values=<EC2_INSTANCE_ID>
aws s3api head-bucket --bucket <RELEASE_BUCKET>
aws iam get-role --role-name <GITHUB_DEPLOY_ROLE_NAME>
aws iam simulate-principal-policy --policy-source-arn <AWS_DEPLOY_ROLE_ARN> --action-names ssm:SendCommand --resource-arns <SSM_DOCUMENT_ARN> <EC2_INSTANCE_ARN>
```

Verify that the instance reports `Online`, the role trust subject exactly matches `repo:Tzu-Huang/Essay-annotator:environment:production`, and the rendered policies contain no `CHANGE_ME` or `${...}` placeholders. Also verify denied access outside the configured S3 prefix, to another instance, and to a different SSM document.

The setup is not production-ready while any `CHANGE_ME` value remains or while reviewer and retention evidence has not been recorded.
