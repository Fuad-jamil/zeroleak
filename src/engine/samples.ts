export interface SamplePreset {
  id: string;
  name: string;
  description: string;
  rawInput: string;
  simulatedResponse: string;
}

export const DEVELOPER_SAMPLE: SamplePreset = {
  id: 'developer',
  name: 'DevOps Stacktrace & Microservices',
  description: 'PostgreSQL URI, shared internal hostnames with query tokens, /srv/ app paths, international phones, and English/Arabic names.',
  rawInput: `# Incident 4092 - Production Microservice Sync Failure
# Environment: Linux production-node-04 (Ubuntu 24.04 LTS)
# Reported by: Ahmed Hassan (ahmed@alamal-pay.com)
# Secondary reviewer: Sara Mansoor (sara@alamal-pay.com)
# Emergency Hotline: +967-777-123-456 | On-Call Lead: 00967771987654

[CONFIGURATION (.env)]
DATABASE_URL="postgresql://db_admin:SuperSecretP@ssw0rd!2026@10.0.0.45:5432/finance_production"
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFobWVkIEhhc3NhbiIsImFkbWluIjp0cnVlfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
WEBHOOK_DISPATCH="https://webhook.internal.alamal-pay.com/v2/notify?token=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
INTERNAL_API_BASE="https://webhook.internal.alamal-pay.com/v2/notify"
BACKUP_GATEWAY=192.168.1.104

[STACKTRACE LOG]
Error: ConnectionRefused at /srv/horus-app/src/db/connection.ts:84:12
    at async syncUserMetadata (/srv/horus-app/src/services/userService.ts:142:9)
    at async handleWebhook (/srv/horus-app/src/controllers/webhook.ts:28:5)
Target Host: 10.0.0.45:5432
Originating Host: 10.0.0.12
Auth Token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFobWVkIEhhc3NhbiIsImFkbWluIjp0cnVlfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

ملاحظة من المهندس (خالد): العميل أحمد منصور أبلغ عن توقف عمليات التحويل عبر تطبيق Al-Amal FinTech.`,
  simulatedResponse: `Here is the root-cause analysis and configuration patch for Incident 4092:

1. **Database Network Connectivity**:
   The service at initiating host **10.0.0.2** cannot establish a socket connection to target host **10.0.0.1:5432**.
   Ensure the PostgreSQL instance URI:
   \`postgresql://db_user_1:DB_PASS_1@10.0.0.1:5432/db_name_1\`
   accepts traffic from subnet \`10.0.0.0/24\` in your pg_hba.conf and AWS security groups.

2. **Webhook Dispatcher**:
   The webhook URL **https://internal-host-1.local/v2/notify?token=SECRET_KEY_1** failed because **https://internal-host-1.local/v2/notify** requires valid authorization. Ensure **JWT_TOKEN_1** is not expired.

3. **Application Directory**:
   Verify permissions in **/srv/app_1/src/db/connection.ts** and reload the process.

4. **Stakeholder Escalation**:
   Notify **Person_1** and **Person_2** at **user_1@domain_1.com** and **user_2@domain_1.com**. For emergency on-call contact, reach out at **+1-555-0001** or **+1-555-0002**.`,
};

export const BUSINESS_SAMPLE: SamplePreset = {
  id: 'business',
  name: 'M&A Brief & Client Inquiries',
  description: 'Arabic & English client names, Project_Titan codenames, corporate partner names, and internal memo.',
  rawInput: `CONFIDENTIAL MEMORANDUM — Project_Horus PARTNERSHIP
Date: October 23, 2026
Lead Negotiator: Ahmed Hassan (ahmed@alamal-pay.com)
Legal Counsel: Sara Mansoor (sara@alamal-pay.com)
Contact Hotline: +967-777-123-456

عزيزي الفريق،
بخصوص صفقة الاستحواذ مع ApexHoldings ومشاركة Al-Amal FinTech:
1. قام العميل أحمد منصور بمراجعة بنود الاتفاقية الخاصة برمز المشروع Project_Horus.
2. أفاد زميله (خالد) بتأكيد استلام الودائع عبر البوابة الداخلية:
   https://webhook.internal.alamal-pay.com/v2/notify?token=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
3. تم تحويل خادم التسوية المالية الاحتياطي إلى 10.0.0.45 لضمان سلامة العمليات.

يرجى إعداد الملخص التنفيذي دون الإفصاح عن أسماء العملاء أو تفاصيل ApexHoldings.`,
  simulatedResponse: `Here is the executive summary prepared for leadership review:

1. **Strategic Deal Alignment**:
   The strategic partnership regarding **Project_Alpha** with **Company_A** is proceeding according to timeline.

2. **Client Verification & Approvals**:
   Primary review was completed by **Person_1** alongside **Person_2**. Both **user_1@domain_1.com** and **user_2@domain_1.com** confirmed contractual milestones.

3. **Settlement Architecture**:
   Disbursement verification completed via **https://internal-host-1.local/v2/notify?token=SECRET_KEY_1** communicating with the private node at **10.0.0.1**.

4. **Support Hotline**:
   Emergency coordination remains available via **+1-555-0001**.`,
};
