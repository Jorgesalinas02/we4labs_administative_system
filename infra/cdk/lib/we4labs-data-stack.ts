import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

/**
 * Base de datos alineada con el plan: Aurora PostgreSQL Serverless v2 + RDS Proxy.
 * Tras el deploy: ejecutar migraciones Drizzle contra el endpoint del proxy con usuario en Secrets Manager.
 */
export class We4labsDataStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "We4Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    const dbSecret = new secretsmanager.Secret(this, "DbSecret", {
      secretName: "we4labs/aurora/credentials",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "we4labs_app" }),
        generateStringKey: "password",
        excludePunctuation: true,
      },
    });

    const cluster = new rds.DatabaseCluster(this, "We4Aurora", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_8,
      }),
      writer: rds.ClusterInstance.serverlessV2("writer"),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 8,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      credentials: rds.Credentials.fromSecret(dbSecret),
      defaultDatabaseName: "we4labs",
      storageEncrypted: true,
    });

    const proxy = new rds.DatabaseProxy(this, "We4Proxy", {
      proxyTarget: rds.ProxyTarget.fromCluster(cluster),
      secrets: [dbSecret],
      vpc,
      iamAuth: false,
      requireTLS: true,
    });

    new cdk.CfnOutput(this, "ClusterEndpoint", { value: cluster.clusterEndpoint.hostname });
    new cdk.CfnOutput(this, "ProxyEndpoint", { value: proxy.endpoint });
    new cdk.CfnOutput(this, "SecretArn", { value: dbSecret.secretArn });
  }
}
