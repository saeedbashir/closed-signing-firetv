import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface CaptionsStackProps extends cdk.StackProps {
  /** Bedrock model IDs, e.g. `anthropic.claude-opus-5`. */
  readonly models: string[];
  readonly resourceScope: 'models' | 'any';
}

/**
 * The Bedrock half of the AWS integration, in one file so the AWS Builder
 * submission can point at it directly.
 *
 * The pipeline generates a **simplified caption track** with Claude on Amazon
 * Bedrock. That is not decoration: for a viewer whose first language is a
 * signed language, written English is a second language, and verbatim caption
 * speed routinely outruns their reading rate. The simplified track is the
 * second half of this project's access argument, alongside the signer layer.
 *
 * Generated captions are always published with `reviewed: false` in the Signed
 * Track Manifest. That is enforced in the pipeline, not in policy, but it is
 * the reason this stack exists separately: the Bedrock permission and the
 * honesty guarantee that goes with it are one concern.
 *
 * The pipeline calls the Messages API endpoint (`bedrock-mantle`), not the
 * legacy `InvokeModel` path, so the action is `bedrock-mantle:CreateInference`
 * rather than `bedrock:InvokeModel`.
 */
export class CaptionsStack extends cdk.Stack {
  public readonly bedrockInvokePolicy: iam.ManagedPolicy;

  constructor(scope: Construct, id: string, props: CaptionsStackProps) {
    super(scope, id, props);

    if (props.models.length === 0) {
      throw new Error('CaptionsStack needs at least one Bedrock model ID');
    }

    const modelArns = props.models.map((model) =>
      cdk.Arn.format({ service: 'bedrock', account: '', resource: 'foundation-model', resourceName: model }, this),
    );
    const resources = props.resourceScope === 'any' ? ['*'] : modelArns;

    this.bedrockInvokePolicy = new iam.ManagedPolicy(this, 'BedrockInference', {
      description: 'Invoke Claude on the Bedrock Messages endpoint to simplify caption tracks',
      statements: [
        new iam.PolicyStatement({
          sid: 'ClaudeMessagesInference',
          effect: iam.Effect.ALLOW,
          actions: ['bedrock-mantle:CreateInference'],
          resources,
        }),
      ],
    });

    new cdk.CfnOutput(this, 'BedrockPolicyArn', {
      value: this.bedrockInvokePolicy.managedPolicyArn,
    });
    new cdk.CfnOutput(this, 'BedrockModels', { value: props.models.join(', ') });
  }
}
