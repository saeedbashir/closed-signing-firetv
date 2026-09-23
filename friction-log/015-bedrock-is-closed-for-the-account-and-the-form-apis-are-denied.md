# 015 — Bedrock is closed for the account, and the APIs behind the access form are denied too

**Date:** 2026-09-23
**Area:** AWS
**Severity:** blocker

## Task attempted

Run the pipeline's `--simplify` step (Claude on Amazon Bedrock) against the
hackathon AWS account, now that the account has been upgraded to a paid plan and
carries the $150 hackathon credit.

## Steps taken

1. Upgraded the account (spend limit $20, credits $250 — $150 hackathon, $100 Free Tier).
2. `aws bedrock list-foundation-models --by-provider anthropic` — lists the models.
3. `aws bedrock-runtime converse --model-id anthropic.claude-opus-5 …` (five tokens).
4. The same with `us.anthropic.claude-opus-5`, `anthropic.claude-haiku-4-5-…`,
   `amazon.nova-lite-v1:0`, `us.amazon.nova-lite-v1:0`.
5. `aws bedrock get-foundation-model-availability --model-id …` for each.
6. `aws bedrock get-use-case-for-model-access`, `aws bedrock
   list-foundation-model-agreement-offers --model-id anthropic.claude-opus-5`.

## Expected

After the upgrade and the credit, model invocation works, or the console's
"Request access" form is the one remaining step and is answerable from the
account.

## Actual

Every invocation, every provider:

```
An error occurred (ValidationException) when calling the Converse operation: Operation not allowed
```

Every model:

```
"agreementAvailability": {"status": "NOT_AVAILABLE"},
"authorizationStatus": "NOT_AUTHORIZED",
"entitlementAvailability": "AVAILABLE",
"regionAvailability": "AVAILABLE"
```

And the form's own APIs are denied by the organisation's service control policy:

```
An error occurred (AccessDeniedException) when calling the GetUseCaseForModelAccess operation:
User: arn:aws:iam::<project-account>:user/<iam-user> is not authorized to perform:
bedrock:GetUseCaseForModelAccess with an explicit deny in a service control policy:
arn:aws:organizations::<management-account>:policy/<org-id>/service_control_policy/p-o59ka7dj
```

The same policy still denies CloudFormation, EC2, Batch, ECR, Lambda, DynamoDB
and IAM after the upgrade. It belongs to the organisation the hackathon account
sits in, so nothing the account owner does — plan, credit, spend limit — reaches
it. The hackathon's AWS Builder track lists Bedrock among the tools to use; the
account it hands out cannot invoke a model, and denies the calls that would
enable one.

## Resolution (same day)

The policy was not the hackathon's. The account had been created in AWS's
"simplified" experience, which places it in an AWS-run organisation with
spend-limit guardrail SCPs. **Activate advanced features** (Console Home →
Activate advanced features; irreversible; needs a second email for the
management account and deletes the spend limit) made the account owner the
organisation's management account, and the guardrails became editable:

```
AdvancedModeRegionRestrictionSecurityControlPolicy   p-2p6va4gc   attached to Root   ← the deny
BudgetsSpendLimitDeny{Bedrock,Lambda,NewWorkloads,SageMaker}Usage   not attached (spend-limit enforcement)
ManagedAccountSecurityControlPolicy, FullAWSAccess   left as they were
```

Detaching `p-2p6va4gc` from Root opened CloudFormation, ECR, Batch, EC2,
Lambda and IAM within a minute, and turned the Bedrock form API's answer from
`AccessDeniedException` (SCP) to `ResourceNotFoundException` (no form on file)
— i.e. the model-access form became submittable. Time lost across two days:
about two hours, most of it believing the denial was outside the account's
control because the policy ARN named an organisation the account did not own.

## And then a second gate

With the SCP gone, the Bedrock console's use-case form itself fails:

```
Your account is not authorized to perform this action. Please create a support case
(https://console.aws.amazon.com/support/home) with details about your use case and we
will get back to you.
```

Every model of every provider reports `authorizationStatus: NOT_AUTHORIZED`
(Amazon Nova included, which needs no Anthropic form), and
`create-foundation-model-agreement` says only "You have not filled out the
request form" — the form the console will not accept. The console notes the form
may be filed "once at the organization's management account"; tried there too,
same banner. This is AWS's hold on Bedrock for accounts it considers new, and a
support case is the sole route. Filed the same day.

## Suggestion

Say in the hackathon's AWS guidance that a simplified-experience account cannot
use CloudFormation, Batch, ECR or Bedrock until advanced features are activated
and the region-restriction SCP is detached, and that the activation is
irreversible — and that a new account then still needs a support case before
Bedrock will invoke any model, which takes days a hackathon calendar does not
have. Pre-authorising Bedrock on the accounts the hackathon hands out would
remove the whole chain. The console's own pages say none of this at the point of failure;
the only clue is a policy ARN in an error message.
