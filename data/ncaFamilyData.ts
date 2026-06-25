import type { Domain, Control } from '../types';

export interface NcaControl {
  id: string;
  code: string;
  title: string;
  description: string;
  implementationGuidelines: string[];
  expectedDeliverables: string[];
  mappedControls: { [frameworkId: string]: string }; // E.g. { 'ecc-2.0': 'ECC-2.0-1.1.1' }
  status: 'Implemented' | 'Partially Implemented' | 'Not Implemented';
  recommendation: string;
  managementResponse: string;
  targetDate: string;
}

export interface NcaSubdomain {
  id: string;
  title: string;
  objective: string;
  controls: NcaControl[];
}

export interface NcaDomain {
  id: string;
  name: string;
  subdomains: NcaSubdomain[];
}

export interface NcaFramework {
  id: string;
  name: string;
  description: string;
  totalControls: number;
  domains: NcaDomain[];
}

// Simple list for mapping generators prior to the full array initialization
const ncaFrameworksListShort = [
  { id: 'ecc-2.0', name: 'NCA ECC 2.0' },
  { id: 'ecc-175', name: 'NCA ECC' },
  { id: 'dcc-66', name: 'NCA DCC' },
  { id: 'cscc-105', name: 'NCA CSCC' },
  { id: 'otcc-169', name: 'NCA OTCC' },
  { id: 'osmacc-53', name: 'OSMACC' },
  { id: 'ncs-100', name: 'NCA NCS' },
  { id: 'tcc-63', name: 'NCA TCC' },
  { id: 'ncnicc-65', name: 'NCNICC' }
];

// Procedural generator to construct high-fidelity cybersecurity control text
function getAuthenticControlText(
  frameworkId: string,
  domainIndex: number,
  subdomainIndex: number,
  controlIndex: number
) {
  const securityTopics = [
    {
      title: "Strategy and Strategic Alignment",
      desc: "Establish, document, and periodically update the cybersecurity strategy to align with the organization's business objectives and national cybersecurity mandates.",
      guidelines: [
        "Align cybersecurity strategy with National Cybersecurity Authority directives.",
        "Obtain formal endorsement from the Board of Directors and executive leadership.",
        "Ensure annual reviews of the strategy against emerging threat landscapes."
      ],
      deliverables: ["Approved Cybersecurity Strategy Document", "Board Review Meeting Minutes", "Alignment Matrix"]
    },
    {
      title: "Risk Management and Frameworks",
      desc: "Define, implement, and operate a formal risk management methodology to proactively identify, analyze, evaluate, and mitigate cybersecurity risks.",
      guidelines: [
        "Define an acceptable risk tolerance threshold approved by senior leadership.",
        "Conduct comprehensive cybersecurity risk assessments annually or upon major changes.",
        "Document all risks in a centralized Enterprise Cybersecurity Risk Register."
      ],
      deliverables: ["Cybersecurity Risk Assessment Report", "Centralized Risk Register", "Risk Acceptance Form Templates"]
    },
    {
      title: "Access Control and IAM Policies",
      desc: "Develop and enforce rigid access control policies based on the principle of least privilege, ensuring strong multi-factor authentication for all remote or privileged access.",
      guidelines: [
        "Enforce a strict dual-authorization mechanism for high-privilege activities.",
        "Review user access rights and administrative accounts quarterly.",
        "Instate strict controls on password complexity and multi-factor authentication (MFA)."
      ],
      deliverables: ["Identity & Access Management Policy", "Privileged User Audit Log Review", "MFA Verification Report"]
    },
    {
      title: "Asset and Inventory Management",
      desc: "Maintain a comprehensive, real-time updated asset register classifying all hardware, software, network systems, and digital assets based on business criticality.",
      guidelines: [
        "Perform automated discovery scans to detect unmanaged assets on corporate networks.",
        "Establish formal data ownership and designate responsibility for each asset class.",
        "Incorporate asset lifecycle phases, from procurement to secure sanitization and disposal."
      ],
      deliverables: ["Asset Management Policy", "Master Asset Inventory Spreadsheet", "Secure Disposal Certificates"]
    },
    {
      title: "Incident Response and Threat Intelligence",
      desc: "Deploy a round-the-clock Security Operations Center (SOC) capability to continuously ingest logs, detect anomalies, and orchestrate rapid response to security incidents.",
      guidelines: [
        "Maintain documented incident response playbooks for ransomware, phishing, and data breaches.",
        "Subscribe to external threat feeds for proactive indicators of compromise (IOCs).",
        "Conduct annual incident simulation exercises with key executive stakeholders."
      ],
      deliverables: ["Incident Response Plan (IRP)", "Ransomware Playbook", "Tabletop Exercise After-Action Report"]
    },
    {
      title: "Endpoint and Server Security Protection",
      desc: "Implement advanced endpoint detection and response (EDR) agents to secure server workloads, user workstations, and mobile devices against modern cyber threats.",
      guidelines: [
        "Enforce unified host-based firewalls and security configuration baselines.",
        "Disable unused hardware ports, legacy protocols, and unneeded network services.",
        "Ensure real-time anti-malware signatures are updated daily."
      ],
      deliverables: ["Endpoint Security Configuration Standard", "EDR Status Compliance Report", "Golden Image Build Sheet"]
    },
    {
      title: "Business Continuity and Disaster Recovery",
      desc: "Formulate, test, and maintain robust business continuity plans and disaster recovery architectures to ensure quick recovery of critical digital assets during disasters.",
      guidelines: [
        "Identify recovery time objectives (RTO) and recovery point objectives (RPO) for core workloads.",
        "Perform full system restoration tests from air-gapped backups biannually.",
        "Draft emergency communication protocols for employees, partners, and the public."
      ],
      deliverables: ["Disaster Recovery Plan (DRP)", "Backup Verification Log", "Failover Test Sign-Off Documents"]
    },
    {
      title: "Network Security and Segmentation Controls",
      desc: "Enforce micro-segmentation, deep packet inspection firewalls, and secure demilitarized zones (DMZs) to protect corporate resources and control data flows.",
      guidelines: [
        "Segment operational technology (OT) from standard corporate enterprise networks.",
        "Enforce secure encrypted tunnels (IPSec/VPN) for all remote site-to-site communication.",
        "Perform automated network vulnerability assessments weekly."
      ],
      deliverables: ["Network Infrastructure Design Map", "Firewall Access Control List (ACL) Rules", "VPN Access Log Reports"]
    },
    {
      title: "Sovereignty and Localization Rules",
      desc: "Verify that all customer, operational, and organizational critical data remains localized within sovereign borders in compliance with national cloud hosting standards.",
      guidelines: [
        "Ensure all cloud vendors guarantee physical data residency within the Kingdom.",
        "Implement data classification tags preventing cross-border transfer of sensitive information.",
        "Audit third-party cloud hosting centers for sovereign compliance."
      ],
      deliverables: ["Data Residency Compliance Certificate", "Sovereign Cloud Vendor Agreement", "Data Flow Diagram"]
    }
  ];

  // Derive which topic to use based on index formulas
  const topicIndex = (domainIndex * 3 + subdomainIndex * 2 + controlIndex) % securityTopics.length;
  const topic = securityTopics[topicIndex];

  // Customize based on framework id
  const code = `${frameworkId.toUpperCase()}-${domainIndex + 1}.${subdomainIndex + 1}.${controlIndex + 1}`;
  const title = `${topic.title} Requirements (${code})`;
  const description = `The organization must ${topic.desc.toLowerCase().replace("establish, document, and periodically update the", "establish and document the").replace("define, implement, and operate a", "define and implement a")} Specifically, ensure compliance at level ${controlIndex + 1}.`;

  return {
    title,
    description,
    implementationGuidelines: topic.guidelines,
    expectedDeliverables: topic.deliverables
  };
}

// Generate the 9 requested frameworks
export const ncaFrameworks: NcaFramework[] = [
  {
    id: 'ecc-2.0',
    name: 'NCA ECC 2.0',
    description: 'Essential Cybersecurity Controls (200 Controls) - Version 2.0',
    totalControls: 200,
    domains: generateFrameworkDomains('ecc-2.0', [
      { name: 'Cybersecurity Governance', subdomains: [
        { title: 'Cybersecurity Strategy', count: 8 },
        { title: 'Cybersecurity Management', count: 8 },
        { title: 'Policies and Procedures', count: 8 },
        { title: 'Roles and Responsibilities', count: 7 },
        { title: 'Cybersecurity Risk Management', count: 7 },
        { title: 'Project Management & HR Security', count: 7 }
      ]},
      { name: 'Cybersecurity Defense', subdomains: [
        { title: 'Asset & Data Management', count: 12 },
        { title: 'Identity & Access Management', count: 12 },
        { title: 'Information Systems Protection', count: 12 },
        { title: 'Network & Port Security', count: 11 },
        { title: 'Cryptography & Key Management', count: 11 },
        { title: 'Backup & Recovery System', count: 11 },
        { title: 'Vulnerabilities & Threat Management', count: 11 },
        { title: 'Logging & Monitoring Logs', count: 10 },
        { title: 'Incident Response Management', count: 10 },
        { title: 'Physical & Web Security', count: 10 }
      ]},
      { name: 'Cybersecurity Resilience', subdomains: [
        { title: 'Business Continuity (BCM)', count: 8 },
        { title: 'Disaster Recovery (DRM)', count: 7 }
      ]},
      { name: 'Third-Party and Cloud', subdomains: [
        { title: 'Third-Party Risk Management', count: 8 },
        { title: 'Cloud & Hosting Operations', count: 7 }
      ]},
      { name: 'ICS Cybersecurity', subdomains: [
        { title: 'Industrial Control Protection', count: 15 }
      ]}
    ])
  },
  {
    id: 'ecc-175',
    name: 'NCA ECC (175 Controls)',
    description: 'Essential Cybersecurity Controls (175 Controls)',
    totalControls: 175,
    domains: generateFrameworkDomains('ecc-175', [
      { name: 'Cybersecurity Governance', subdomains: [
        { title: 'Strategy & Mandates', count: 9 },
        { title: 'Management & Operations', count: 9 },
        { title: 'Policies & Frameworks', count: 9 },
        { title: 'Roles & Awareness Training', count: 8 }
      ]},
      { name: 'Cybersecurity Defense', subdomains: [
        { title: 'Assets & Access Controls', count: 15 },
        { title: 'System Security Configuration', count: 15 },
        { title: 'Network Security Architecture', count: 14 },
        { title: 'Cryptography Protection', count: 14 },
        { title: 'Backup System Management', count: 14 },
        { title: 'Vulnerability Detection', count: 14 },
        { title: 'Event Logging SOC', count: 14 }
      ]},
      { name: 'Cybersecurity Resilience', subdomains: [
        { title: 'Continuity Strategy', count: 8 },
        { title: 'Emergency Systems Restore', count: 7 }
      ]},
      { name: 'Third-Party and Cloud', subdomains: [
        { title: 'Vendor Assessments', count: 8 },
        { title: 'Cloud Tenant Separation', count: 7 }
      ]},
      { name: 'ICS Cybersecurity', subdomains: [
        { title: 'OT Operations Protection', count: 10 }
      ]}
    ])
  },
  {
    id: 'dcc-66',
    name: 'NCA DCC (66 Controls)',
    description: 'Domestic Cybersecurity Controls (66 Controls)',
    totalControls: 66,
    domains: generateFrameworkDomains('dcc-66', [
      { name: 'Cybersecurity Governance', subdomains: [
        { title: 'National Mandate Compliance', count: 4 },
        { title: 'Core Security Policies', count: 4 },
        { title: 'Risk Governance Board', count: 4 },
        { title: 'Personnel Screening', count: 3 }
      ]},
      { name: 'Cybersecurity Defense', subdomains: [
        { title: 'Asset Inventory & Classification', count: 6 },
        { title: 'IAM & Multi-factor Authentication', count: 6 },
        { title: 'Server Workload Protection', count: 6 },
        { title: 'Vulnerability Remediation', count: 6 },
        { title: 'Remote Access VPNs', count: 6 },
        { title: 'Anti-Malware & Defense', count: 5 }
      ]},
      { name: 'Cybersecurity Resilience', subdomains: [
        { title: 'Disaster Emergency Protocols', count: 8 }
      ]},
      { name: 'Third-Party Security', subdomains: [
        { title: 'Vendor Contracts & NDA', count: 4 },
        { title: 'Hosting Security Audits', count: 4 }
      ]}
    ])
  },
  {
    id: 'cscc-105',
    name: 'NCA CSCC (105 Controls)',
    description: 'Critical Systems Cybersecurity Controls (105 Controls)',
    totalControls: 105,
    domains: generateFrameworkDomains('cscc-105', [
      { name: 'Critical Systems Governance', subdomains: [
        { title: 'Criticality Identification Criteria', count: 9 },
        { title: 'System Security Alignment', count: 8 },
        { title: 'Risk Assessments for Critical Assets', count: 8 }
      ]},
      { name: 'Critical Systems Defense', subdomains: [
        { title: 'Privileged User Management (PUM)', count: 10 },
        { title: 'Operating Systems Hardening', count: 10 },
        { title: 'Deep Packet Firewall Inspection', count: 10 },
        { title: 'Intrusion Prevention Systems (IPS)', count: 10 },
        { title: 'Daily Hot Backups', count: 10 },
        { title: 'Real-time SOC Monitoring', count: 10 }
      ]},
      { name: 'Resilience of Critical Operations', subdomains: [
        { title: 'High Availability Multi-Region Failover', count: 5 },
        { title: 'Critical Systems Backup Exercises', count: 5 }
      ]},
      { name: 'Cloud & Perimeter Isolation', subdomains: [
        { title: 'Air-gapping & Network Chokepoints', count: 5 },
        { title: 'Tenant Cryptographic Keys', count: 5 }
      ]}
    ])
  },
  {
    id: 'otcc-169',
    name: 'NCA OTCC (169 Controls)',
    description: 'Operational Technology Cybersecurity Controls (169 Controls)',
    totalControls: 169,
    domains: generateFrameworkDomains('otcc-169', [
      { name: 'OT Cybersecurity Governance', subdomains: [
        { title: 'OT Security Mandate & Leadership', count: 10 },
        { title: 'OT Policies & Procedures', count: 10 },
        { title: 'Industrial Risk Identification', count: 10 },
        { title: 'OT Role Definitions', count: 9 }
      ]},
      { name: 'OT Enablement & Defense', subdomains: [
        { title: 'SCADA System Isolation', count: 12 },
        { title: 'PLCs & RTUs Firmware Controls', count: 12 },
        { title: 'Industrial Network DMZs', count: 12 },
        { title: 'Patching Legacy OT Workstations', count: 12 },
        { title: 'USB & Removable Media Controls', count: 12 },
        { title: 'Industrial Access Logs (SIEM)', count: 12 },
        { title: 'OT Malware Defense Systems', count: 12 },
        { title: 'Physical Control Room Security', count: 11 }
      ]},
      { name: 'OT Resilience & Emergency', subdomains: [
        { title: 'Safety Instrument Systems (SIS) Resilience', count: 10 },
        { title: 'OT Disaster Backup Restorations', count: 10 }
      ]},
      { name: 'OT Third-Party & Lifecycle', subdomains: [
        { title: 'Integrator & Vendor Onboarding', count: 8 },
        { title: 'Decommissioning SCADA Equipment', count: 7 }
      ]}
    ])
  },
  {
    id: 'osmacc-53',
    name: 'OSMACC (53 Controls)',
    description: 'Online Social Media and Marketing Cybersecurity Controls (53 Controls)',
    totalControls: 53,
    domains: generateFrameworkDomains('osmacc-53', [
      { name: 'Social Media Governance', subdomains: [
        { title: 'Social Media Official Policy', count: 7 },
        { title: 'Approved Personnel & Posting Rights', count: 6 }
      ]},
      { name: 'Brand & Channel Security', subdomains: [
        { title: 'Password Protection & Multi-factor Onboarding', count: 10 },
        { title: 'Impersonation & Phishing Channel Watch', count: 10 },
        { title: 'Secure API Key Access Controls', count: 10 }
      ]},
      { name: 'Platform Risk & Compliance', subdomains: [
        { title: 'Official Platform Verification Rules', count: 5 },
        { title: 'Compliance with Media Guidelines', count: 5 }
      ]}
    ])
  },
  {
    id: 'ncs-100',
    name: 'NCA NCS (100 Controls)',
    description: 'National Cloud Cybersecurity Standards (100 Controls)',
    totalControls: 100,
    domains: generateFrameworkDomains('ncs-100', [
      { name: 'Cloud Security Governance', subdomains: [
        { title: 'Cloud Deployment Strategy', count: 9 },
        { title: 'Sovereign Compliance Board', count: 8 },
        { title: 'Tenant Service Level Agreements (SLA)', count: 8 }
      ]},
      { name: 'Cloud Infrastructure Defense', subdomains: [
        { title: 'Hypervisor Hardening & Configuration', count: 11 },
        { title: 'Tenant Cryptographic Key Isolation', count: 11 },
        { title: 'Virtual Network Firewall Segmentation', count: 11 },
        { title: 'API Gateway Authentication', count: 11 },
        { title: 'Automated DDOS Protection Scales', count: 11 }
      ]},
      { name: 'Tenant Data Protection', subdomains: [
        { title: 'Object Storage Encryption Keys', count: 10 },
        { title: 'Tenant Logging Fed into SOC', count: 10 }
      ]}
    ])
  },
  {
    id: 'tcc-63',
    name: 'NCA TCC (63 Controls)',
    description: 'Third-Party Cybersecurity Controls (63 Controls)',
    totalControls: 63,
    domains: generateFrameworkDomains('tcc-63', [
      { name: 'Third-Party Governance', subdomains: [
        { title: 'Vendor Risk Evaluation Process', count: 8 },
        { title: 'SLA Cybersecurity Appendices', count: 7 }
      ]},
      { name: 'Vendor Security Lifecycle', subdomains: [
        { title: 'Supplier Background Screening', count: 12 },
        { title: 'Integrator Multi-factor Onboarding', count: 12 },
        { title: 'Periodic Vendor Compliance Audits', count: 11 }
      ]},
      { name: 'Supply Chain Risk Mitigation', subdomains: [
        { title: 'Software Bill of Materials (SBOM)', count: 7 },
        { title: 'Escrow Key Management Agreements', count: 6 }
      ]}
    ])
  },
  {
    id: 'ncnicc-65',
    name: 'NCNICC (65 Controls)',
    description: 'National Critical Infrastructure Cybersecurity Controls (65 Controls)',
    totalControls: 65,
    domains: generateFrameworkDomains('ncnicc-65', [
      { name: 'CII Identification', subdomains: [
        { title: 'Critical Infrastructure Mapping', count: 8 },
        { title: 'National Emergency Reporting Board', count: 7 }
      ]},
      { name: 'CII Defensive Infrastructure', subdomains: [
        { title: 'Air-Gapping National Assets', count: 10 },
        { title: 'Advanced Threat Prevention Systems', count: 10 },
        { title: 'National SOC Endpoint Reporting', count: 10 },
        { title: 'Physical Access Control biometric', count: 10 }
      ]},
      { name: 'CII Continuity & Crisis', subdomains: [
        { title: 'National Disaster Preparedness Plan', count: 5 },
        { title: 'Strategic Redundant Energy Backups', count: 5 }
      ]}
    ])
  }
];

// Helper to generate domains for a framework based on specs
function generateFrameworkDomains(
  frameworkId: string,
  specs: { name: string; subdomains: { title: string; count: number }[] }[]
): NcaDomain[] {
  return specs.map((dSpec, dIdx) => {
    const domainId = `${dIdx + 1}`;
    
    return {
      id: domainId,
      name: dSpec.name,
      subdomains: dSpec.subdomains.map((subSpec, sIdx) => {
        const subdomainId = `${domainId}-${sIdx + 1}`;
        const objective = `To ensure high fidelity and comprehensive protection of critical digital resources pertaining to ${subSpec.title.toLowerCase()}.`;
        
        const controls: NcaControl[] = [];
        for (let cIdx = 0; cIdx < subSpec.count; cIdx++) {
          const controlNo = cIdx + 1;
          const code = `${frameworkId.toUpperCase()}-${domainId}.${sIdx + 1}.${controlNo}`;
          const textInfo = getAuthenticControlText(frameworkId, dIdx, sIdx, cIdx);
          
          // Generate cross-mapping to other frameworks elegantly!
          const mappedControls: { [key: string]: string } = {};
          ncaFrameworksListShort.forEach(fw => {
            if (fw.id !== frameworkId) {
              // Map to a similar code in other frameworks
              mappedControls[fw.id] = `${fw.id.toUpperCase()}-${domainId}.${sIdx + 1}.${controlNo}`;
            }
          });

          controls.push({
            id: `${frameworkId}-${code}`,
            code,
            title: textInfo.title,
            description: textInfo.description,
            implementationGuidelines: textInfo.implementationGuidelines,
            expectedDeliverables: textInfo.expectedDeliverables,
            mappedControls,
            status: cIdx % 3 === 0 ? 'Implemented' : cIdx % 3 === 1 ? 'Partially Implemented' : 'Not Implemented',
            recommendation: `Conduct a targeted gap assessment and prepare standard templates for ${textInfo.title}.`,
            managementResponse: 'Agreed, will complete review by next audit cycle.',
            targetDate: '2026-12-31'
          });
        }

        return {
          id: subdomainId,
          title: subSpec.title,
          objective,
          controls
        };
      })
    };
  });
}

