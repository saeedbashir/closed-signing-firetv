import * as cdk from 'aws-cdk-lib';
import * as batch from 'aws-cdk-lib/aws-batch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ProcessingStackProps extends cdk.StackProps {
  readonly sources: s3.IBucket;
  readonly assets: s3.IBucket;
  readonly bedrockInvokePolicy: iam.IManagedPolicy;
  readonly retainData: boolean;
  readonly maxVcpus: number;
  readonly jobVcpu: number;
  readonly jobMemoryMib: number;
  readonly jobStorageGib: number;
}

/**
 * AWS Batch on Fargate, running the extraction container once per title.
 *
 * The VPC has public subnets and no NAT gateway: tasks get a public IP and
 * reach S3, ECR and Bedrock directly. A NAT gateway would cost more per month
 * than this project's entire compute bill, for no benefit here.
 */
export class ProcessingStack extends cdk.Stack {
  public readonly repository: ecr.Repository;
  public readonly jobQueue: batch.JobQueue;
  public readonly jobDefinition: batch.EcsJobDefinition;

  constructor(scope: Construct, id: string, props: ProcessingStackProps) {
    super(scope, id, props);

    const removalPolicy = props.retainData ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [{ name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }],
    });

    this.repository = new ecr.Repository(this, 'PipelineImage', {
      imageScanOnPush: true,
      removalPolicy,
      emptyOnDelete: !props.retainData,
      lifecycleRules: [{ description: 'Keep the last 5 images', maxImageCount: 5 }],
    });

    // What the container is allowed to touch. Read the source material, write
    // the renditions, and call Claude to simplify captions. Nothing else.
    const jobRole = new iam.Role(this, 'JobRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Closed Signing extraction job',
      managedPolicies: [props.bedrockInvokePolicy],
    });
    props.sources.grantRead(jobRole);
    props.assets.grantReadWrite(jobRole);

    const logGroup = new logs.LogGroup(this, 'JobLogs', {
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const computeEnvironment = new batch.FargateComputeEnvironment(this, 'Compute', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      maxvCpus: props.maxVcpus,
      spot: false,
    });

    this.jobQueue = new batch.JobQueue(this, 'Queue', { priority: 1 });
    this.jobQueue.addComputeEnvironment(computeEnvironment, 1);

    const container = new batch.EcsFargateContainerDefinition(this, 'Container', {
      image: ecs.ContainerImage.fromEcrRepository(this.repository, 'latest'),
      cpu: props.jobVcpu,
      memory: cdk.Size.mebibytes(props.jobMemoryMib),
      ephemeralStorageSize: cdk.Size.gibibytes(props.jobStorageGib),
      assignPublicIp: true,
      jobRole,
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'extract', logGroup }),
      environment: {
        STM_SOURCES_BUCKET: props.sources.bucketName,
        STM_ASSETS_BUCKET: props.assets.bucketName,
        // The detector cache lives on task storage; the image ships no weights.
        STM_MODEL_DIR: '/tmp/models',
      },
      // Overridden per submission with the title id; see infra/README.md.
      command: ['--help'],
    });

    this.jobDefinition = new batch.EcsJobDefinition(this, 'ExtractTitle', {
      container,
      retryAttempts: 2,
      timeout: cdk.Duration.hours(2),
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', { value: this.repository.repositoryUri });
    new cdk.CfnOutput(this, 'JobQueueName', { value: this.jobQueue.jobQueueName });
    new cdk.CfnOutput(this, 'JobDefinitionName', {
      value: this.jobDefinition.jobDefinitionName,
    });
  }
}
