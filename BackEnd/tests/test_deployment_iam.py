import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
IAM_DIR = ROOT / "deploy" / "iam"


def load_policy(name: str) -> dict:
    return json.loads((IAM_DIR / name).read_text(encoding="utf-8"))


def statements(policy: dict) -> dict[str, dict]:
    return {statement["Sid"]: statement for statement in policy["Statement"]}


def test_github_oidc_trust_is_bound_to_production_environment() -> None:
    policy = load_policy("github-production-oidc-trust.json.template")
    statement = policy["Statement"][0]

    assert statement["Action"] == "sts:AssumeRoleWithWebIdentity"
    assert statement["Condition"]["StringEquals"] == {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": (
            "repo:Tzu-Huang/Essay-annotator:environment:production"
        ),
    }


def test_github_deploy_policy_is_prefix_instance_and_document_scoped() -> None:
    policy = statements(load_policy("github-production-deploy-policy.json.template"))

    objects = policy["PublishImmutableProductionReleaseObjects"]
    assert set(objects["Action"]) == {"s3:GetObject", "s3:PutObject"}
    assert objects["Resource"].endswith("/${RELEASE_PREFIX}/*")
    assert "s3:DeleteObject" not in objects["Action"]

    command = policy["InvokeFixedProductionDeploymentDocument"]
    assert command["Action"] == "ssm:SendCommand"
    assert command["Resource"] == [
        "arn:aws:ssm:${AWS_REGION}:${AWS_ACCOUNT_ID}:document/${SSM_DOCUMENT_NAME}",
        "arn:aws:ec2:${AWS_REGION}:${AWS_ACCOUNT_ID}:instance/${EC2_INSTANCE_ID}",
    ]


def test_ec2_policy_can_only_read_release_prefix() -> None:
    policy = statements(load_policy("ec2-production-release-read-policy.json.template"))
    actions = {
        action
        for statement in policy.values()
        for action in (
            statement["Action"]
            if isinstance(statement["Action"], list)
            else [statement["Action"]]
        )
    }

    assert actions == {"s3:ListBucket", "s3:GetObject"}
    assert policy["ReadProductionReleaseObjects"]["Resource"].endswith(
        "/${RELEASE_PREFIX}/*"
    )


def test_ssm_document_has_fixed_command_and_constrained_parameters() -> None:
    document = load_policy("essay-annotator-deploy-ssm-document.json.template")
    command = document["mainSteps"][0]["inputs"]["runCommand"]

    assert len(command) == 1
    assert command[0].startswith('case "$SSM_Operation" in ')
    assert command[0].count("/usr/local/sbin/essay-annotator-deploy") == 3
    assert "AWS-RunShellScript" not in command[0]
    assert "exec $" not in command[0]
    assert "deploy --sha \"$SSM_CommitSha\"" in command[0]
    assert '--bucket "$SSM_ReleaseBucket"' in command[0]
    assert '--key "$SSM_ReleaseKey"' in command[0]
    rollback = command[0].split("rollback)", 1)[1].split(";;", 1)[0]
    assert "rollback --deployment-id" in rollback
    assert "--sha" not in rollback
    assert '--reason "$SSM_Reason"' in rollback
    assert "rollback-drill --sha \"$SSM_CommitSha\"" in command[0]
    assert '--target-sha "$SSM_TargetSha"' in command[0]
    assert "{{" not in command[0]
    assert set(document["parameters"]) == {
        "Operation",
        "CommitSha",
        "TargetSha",
        "ArtifactDigest",
        "ReleaseBucket",
        "ReleaseKey",
        "DeploymentId",
        "Actor",
        "Trigger",
        "Reason",
    }
    assert document["parameters"]["Operation"]["allowedValues"] == [
        "deploy",
        "rollback",
        "rollback-drill",
    ]
    assert document["parameters"]["Reason"]["allowedValues"] == [
        "public_health_failed",
        "operator_requested",
    ]
    for optional_name in (
        "CommitSha",
        "TargetSha",
        "ArtifactDigest",
        "ReleaseBucket",
        "ReleaseKey",
    ):
        assert document["parameters"][optional_name]["default"] == ""
    assert document["parameters"]["ReleaseBucket"]["allowedPattern"] == (
        "^(|[a-z0-9][a-z0-9.-]{1,61}[a-z0-9])$"
    )
    assert document["parameters"]["ReleaseKey"]["allowedPattern"] == (
        r"^(?!.*\.\.)(|[A-Za-z0-9][A-Za-z0-9._/-]{0,511})$"
    )
    assert all(
        parameter["interpolationType"] == "ENV_VAR"
        for parameter in document["parameters"].values()
    )


class DeploymentIamTests(unittest.TestCase):
    test_github_oidc_trust_is_bound_to_production_environment = staticmethod(
        test_github_oidc_trust_is_bound_to_production_environment
    )
    test_github_deploy_policy_is_prefix_instance_and_document_scoped = staticmethod(
        test_github_deploy_policy_is_prefix_instance_and_document_scoped
    )
    test_ec2_policy_can_only_read_release_prefix = staticmethod(
        test_ec2_policy_can_only_read_release_prefix
    )
    test_ssm_document_has_fixed_command_and_constrained_parameters = staticmethod(
        test_ssm_document_has_fixed_command_and_constrained_parameters
    )


if __name__ == "__main__":
    unittest.main()
