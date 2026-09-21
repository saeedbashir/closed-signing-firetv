import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface DeliveryStackProps extends cdk.StackProps {
  readonly retainData: boolean;
}

/**
 * What the TV app plays, and the CloudFront distribution that serves it.
 *
 * The bucket is private; CloudFront reaches it through an origin access
 * control. The bucket policy that grants this references the distribution, so
 * the two belong in one stack.
 *
 * Two cache behaviours, because the objects age differently: video and posters
 * are immutable once written, while manifests and captions are rewritten
 * whenever a title is reprocessed and must not sit stale on a device.
 */
export class DeliveryStack extends cdk.Stack {
  public readonly assets: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: DeliveryStackProps) {
    super(scope, id, props);

    this.assets = new s3.Bucket(this, 'Assets', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: props.retainData ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !props.retainData,
    });

    const origin = origins.S3BucketOrigin.withOriginAccessControl(this.assets);

    // A TV app fetches manifests with fetch(); without CORS this fails in a way
    // that is tedious to diagnose on a device.
    const headers = new cloudfront.ResponseHeadersPolicy(this, 'AssetHeaders', {
      comment: 'CORS for manifest and caption fetches from the Vega app',
      corsBehavior: {
        accessControlAllowOrigins: ['*'],
        accessControlAllowHeaders: ['*'],
        accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
        accessControlAllowCredentials: false,
        accessControlMaxAge: cdk.Duration.days(1),
        originOverride: true,
      },
    });

    const shortCache = new cloudfront.CachePolicy(this, 'ManifestCache', {
      comment: 'Manifests and captions: short TTL so a reprocessed title appears quickly',
      defaultTtl: cdk.Duration.minutes(1),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.minutes(5),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    const common = {
      origin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      responseHeadersPolicy: headers,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      compress: true,
    };

    this.distribution = new cloudfront.Distribution(this, 'Cdn', {
      comment: 'Closed Signing asset delivery',
      defaultBehavior: { ...common, cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED },
      additionalBehaviors: {
        '*.json': { ...common, cachePolicy: shortCache },
        '*.vtt': { ...common, cachePolicy: shortCache },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      enableIpv6: true,
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', { value: this.assets.bucketName });
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'Asset base URL. Put this in the app config.',
    });
    new cdk.CfnOutput(this, 'CatalogueUrl', {
      value: `https://${this.distribution.distributionDomainName}/catalogue.json`,
    });
  }
}
