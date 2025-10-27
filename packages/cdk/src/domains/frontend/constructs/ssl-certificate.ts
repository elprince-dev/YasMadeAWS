import { CfnOutput, Stack, Tags } from "aws-cdk-lib";
import { Certificate, CertificateValidation, KeyAlgorithm } from "aws-cdk-lib/aws-certificatemanager";
import { Key } from "aws-cdk-lib/aws-kms";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";


// Props for SSL Certificate construct
export interface SslCertificateProps {
    // Domain name for certificate
    readonly domainName: string;
    // Route53 hosted zone for DNS validation
    readonly hostedZone: IHostedZone;
    // Certificate region (must be us-east-1 for CloudFront)
    readonly region: string;
    // Resource tags
    readonly tags?: { [key: string]: string }
}

/**
 * SSL Certificate construct with automatic DNS validation
 * Creates ACM certificate validated via Route53 DNS records
 */
export class SslCertificate extends Construct {
    // The ACM certificate resource
    public readonly certificate: Certificate;

    constructor(scope: Construct, id: string, props: SslCertificateProps){
        super(scope,id);

        // Create ACM certificate with DNS validation
        this.certificate = new Certificate(this, 'Certificate',{
            // Primary domain name
            domainName: props.domainName,

            // Include www subdomain as Subject Alternative Name (SAN)
            subjectAlternativeNames:[`www.${props.domainName}`],

            // Use DNS validation (automatic via Route53)
            validation: CertificateValidation.fromDns(props.hostedZone),

            // Certificate description
            certificateName: `SSL Certificate for ${props.domainName}`,

            // Key algorithm (RSA 2048 is standard)
            keyAlgorithm: KeyAlgorithm.RSA_2048,
        })

        // Apply tags if provided
        if (props.tags) {
            Object.entries(props.tags).forEach(([key, value]) => {
                Tags.of(this.certificate).add(key, value);
            })
        }

        // Output certificate ARN for reference
        new CfnOutput(this, 'CertificateArn', {
            value: this.certificate.certificateArn,
            description: 'ACM Certificate ARN',
            exportName: `${Stack.of(this).stackName}-CertificateArn}`
        })
    }
}