# Infraestructura AWS

## CDK — Aurora Serverless v2 + RDS Proxy

Paquete: [`cdk/`](./cdk).

```bash
cd infra/cdk
pnpm install
pnpm exec cdk synth    # plantilla CloudFormation
pnpm exec cdk deploy # requiere cuenta AWS bootstrapped
```

Stack `We4labsData`: VPC (2 AZ, 1 NAT), clúster Aurora PostgreSQL 15.8 Serverless v2, **RDS Proxy**, credenciales en **Secrets Manager**.

Outputs: `ClusterEndpoint`, `ProxyEndpoint`, `SecretArn`. La app Lambda/Next debe usar el **endpoint del proxy** y construir `DATABASE_URL` con usuario/contraseña del secreto.

### Siguientes piezas (fuera de este stack)

- **API Gateway HTTP API** + **Lambda** (`services/api`) con authorizer **Cognito**.
- **Cognito User Pool** con atributo personalizado `tenant_id`.
- **Pusher** en Secrets Manager para el runtime serverless.

Desarrollo local: `docker-compose.yml` en la raíz del monorepo.
