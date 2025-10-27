import { NAMING } from "../config/constants/aws";

// Generate consistent resource names across environments
export class ResourceNaming {

    /**
   * Creates a standardized resource name
   * @param resourceType - Type of AWS resource (e.g., 's3', 'cloudfront', 'certificate')
   * @param environment - Environment name (dev, staging, prod)
   * @param suffix - Optional additional identifier
   * @returns Formatted resource name
   */
    static createName(resourceType:string, environment:string, suffix?: string): string {
        const parts = [NAMING.PREFIX, resourceType, environment];
        
        if (suffix) parts.push(suffix);
        const name = parts.join(NAMING.SEPARATOR);

        // Ensure name doesn't exceed AWS limits
        if(name.length > NAMING.MAX_LENGTH) {
            throw new Error(`Resource name "${name}" exceeds maximum length of ${NAMING.MAX_LENGTH}`);
        } 
        
        return name;
    }

   /**
   * Creates S3 bucket name (must be globally unique and DNS compliant)
   * @param environment - Environment name
   * @param purpose - Bucket purpose (e.g., 'static-website', 'build-artifacts')
   * @returns S3-compliant bucket name
   */
  static createBucketName(environment: string, purpose:string): string {
    return this.createName('s3', environment, purpose).toLowerCase();
  }

  /**
   * Creates CloudFront distribution name
   * @param environment - Environment name
   * @returns CloudFront distribution name
   */
  static createDistributionName(environment:string): string {
    return this.createName('cloudfront', environment, 'distribution');
  }

  /**
   * Creates ACM certificate name
   * @param environment - Environment name
   * @param domain - Domain name for the certificate
   * @returns Certificate name
   */
  static createCertificateName(environment:string, domain:string): string {
    // Replace dots with dashes for AWS resource naming
    const domainSafe = domain.replace(/\./g, '-');
    return this.createName('cert', environment, domainSafe);
  }

  /**
   * Creates Route53 hosted zone name
   * @param environment - Environment name
   * @param domain - Domain name
   * @returns Hosted zone name
   */
  static createHostedZoneName(environment:string, domain:string): string {
    const domainSafe = domain.replace(/\./g, '-');
    return this.createName('hz', environment, domainSafe)
  }
}