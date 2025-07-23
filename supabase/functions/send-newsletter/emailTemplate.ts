// components/EmailTemplate.tsx

import { Html, Body, Container, Section, Text, Img } from '@react-email/components';

type EmailTemplateProps = {
  title: string;
  body: string;
};

export const EmailTemplate = ({ title, body }: EmailTemplateProps) => (
  <Html>
    <Body style={main}>
      <Container style={container}>
        {/* Title */}
        <Section>
          <Text style={titleStyle}>{title}</Text>
        </Section>

        {/* Body */}
        <Section>
          <Text style={bodyStyle}>{body}</Text>
        </Section>

        {/* Signature */}
        <Section style={signatureSection}>
          <Img
            src="https://yasmade.net/logo.png" // Replace with actual logo URL
            width="100"
            alt="YasMade Logo"
          />
          <Text style={signatureText}>
            Best regards,<br />
            YasMade Team<br />
            <a href="https://yasmade.net" style={linkStyle}>www.yasmade.net</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default EmailTemplate;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  padding: '20px',
};

const container = {
  margin: '0 auto',
  padding: '20px',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  maxWidth: '600px',
};

const titleStyle = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const bodyStyle = {
  fontSize: '16px',
  lineHeight: '1.5',
};

const signatureSection = {
  marginTop: '32px',
  borderTop: '1px solid #ccc',
  paddingTop: '20px',
  textAlign: 'left' as const,
};

const signatureText = {
  fontSize: '14px',
  color: '#333',
};

const linkStyle = {
  color: '#007bff',
  textDecoration: 'none',
};
