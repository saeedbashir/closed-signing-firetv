import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  readonly retainData: boolean;
}

/**
 * The ingest side: material we downloaded from publishers, before processing.
 *
 * Processed output lives in the delivery stack instead, next to the CloudFront
 * distribution that serves it -- a bucket fronted by an origin access control
 * and the distribution that reaches it are one unit, and separating them
 * creates a cross-stack cycle.
 */
export class StorageStack extends cdk.Stack {
  public readonly sources: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    this.sources = new s3.Bucket(this, 'Sources', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: props.retainData ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !props.retainData,
      lifecycleRules: [
        {
          // Source video is large and read only when a title is reprocessed.
          id: 'cool-down-sources',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    new cdk.CfnOutput(this, 'SourcesBucketName', { value: this.sources.bucketName });
  }
}
