import type { AssessmentItem } from '../types';

export const cmaAssessmentData: AssessmentItem[] = [
    // --- MAIN DOMAIN 1: CYBERSECURITY GOVERNANCE (CMA-4.1) ---
    {
        domainCode: "1",
        domainName: "Cybersecurity Governance",
        subDomainCode: "1.1",
        subdomainName: "Leadership and Responsibilities (CMA-4.1.1)",
        controlCode: "CMA-4.1.1.1",
        controlName: "Establish a separated, independent Cybersecurity Department headed by a full-time, qualified Saudi national.",
        currentStatusDescription: "Independent cybersecurity department established and led by a qualified Saudi CISO.",
        controlStatus: "Implemented",
        recommendation: "Maintain qualified staffing levels and ensure regular professional training.",
        managementResponse: "In place.",
        targetDate: "Compliant",
        mappedStandards: {
            nca: "NCA ECC-1.1.1",
            sama: "SAMA CSF-2.1.1",
            iso: "ISO 27001:2022 A.5.2",
            nist: "NIST CSF GV.OC"
        }
    },
    {
        domainCode: "1",
        domainName: "Cybersecurity Governance",
        subDomainCode: "1.1",
        subdomainName: "Leadership and Responsibilities (CMA-4.1.1)",
        controlCode: "CMA-4.1.1.2",
        controlName: "Form a Board-level/CEO-associated Cybersecurity Committee comprising the Head of Cybersecurity and other department heads.",
        currentStatusDescription: "Cybersecurity steering committee meets quarterly to review objectives and risks.",
        controlStatus: "Implemented",
        recommendation: "Ensure committee charters are formally approved by the Board of Directors.",
        managementResponse: "Approved by BOD.",
        targetDate: "Compliant",
        mappedStandards: {
            nca: "NCA ECC-1.1.2",
            sama: "SAMA CSF-2.1.2",
            iso: "ISO 27001:2022 A.5.3",
            nist: "NIST CSF GV.GO"
        }
    },
    {
        domainCode: "1",
        domainName: "Cybersecurity Governance",
        subDomainCode: "1.2",
        subdomainName: "Data Governance and Security (CMA-4.1.2)",
        controlCode: "CMA-4.1.2.1",
        controlName: "Design and develop a Data Governance Program identifying data fields, owners, custodians, users, and dictating secure encoding.",
        currentStatusDescription: "General data classification is active, but a centralized data governance program is being finalized.",
        controlStatus: "Partially Implemented",
        recommendation: "Document the formal Data Governance Program and roll out automated tagging of sensitive capital market client data.",
        managementResponse: "Project initiated under Chief Data Officer.",
        targetDate: "Q3 2026",
        mappedStandards: {
            nca: "NCA ECC-1.3.1",
            sama: "SAMA CSF-3.1.1",
            iso: "ISO 27001:2022 A.8.11",
            nist: "NIST CSF PR.DS"
        }
    },
    {
        domainCode: "1",
        domainName: "Cybersecurity Governance",
        subDomainCode: "1.3",
        subdomainName: "Strategy and Policies (CMA-4.1.3)",
        controlCode: "CMA-4.1.3.1",
        controlName: "Formulate, approve, and periodically review cybersecurity strategy and policies aligned with market objectives.",
        currentStatusDescription: "Comprehensive policies defined but some technical standards require alignment with latest CMA circulars.",
        controlStatus: "Partially Implemented",
        recommendation: "Review and update cybersecurity strategy annually to reflect new regulatory obligations.",
        managementResponse: "Currently under review.",
        targetDate: "Q4 2026",
        mappedStandards: {
            nca: "NCA ECC-1.2.1",
            sama: "SAMA CSF-2.2.1",
            iso: "ISO 27001:2022 A.5.1",
            nist: "NIST CSF GV.PO"
        }
    },
    {
        domainCode: "1",
        domainName: "Cybersecurity Governance",
        subDomainCode: "1.4",
        subdomainName: "Training and Awareness (CMA-4.1.4)",
        controlCode: "CMA-4.1.4.1",
        controlName: "Implement a Cybersecurity Awareness Program covering social engineering, safe browsing, phishing, and mobile device handling.",
        currentStatusDescription: "General IT induction is provided, but no specific cybersecurity awareness program related to market risks exists.",
        controlStatus: "Partially Implemented",
        recommendation: "Launch a mandatory annual cybersecurity awareness program covering phishing, insider trading risks, and data protection.",
        managementResponse: "Agree",
        targetDate: "Q4 2026",
        mappedStandards: {
            nca: "NCA ECC-1.5.1",
            sama: "SAMA CSF-2.4.1",
            iso: "ISO 27001:2022 A.6.3",
            nist: "NIST CSF PR.AT"
        }
    },
    {
        domainCode: "1",
        domainName: "Cybersecurity Governance",
        subDomainCode: "1.5",
        subdomainName: "HR Cybersecurity Controls (CMA-4.1.5)",
        controlCode: "CMA-4.1.5.1",
        controlName: "Ensure non-disclosure clauses, security screening of staff, and swift access removal upon termination are enforced.",
        currentStatusDescription: "NDAs are standard. Access removal procedures are defined but not always completed within 24 hours.",
        controlStatus: "Partially Implemented",
        recommendation: "Automate the de-provisioning trigger upon HR system termination events.",
        managementResponse: "Integrating HR portal with Active Directory.",
        targetDate: "Q2 2026",
        mappedStandards: {
            nca: "NCA ECC-1.4.1",
            sama: "SAMA CSF-2.3.2",
            iso: "ISO 27001:2022 A.6.1",
            nist: "NIST CSF PR.HR"
        }
    },

    // --- MAIN DOMAIN 2: RISK MANAGEMENT, REVIEW AND AUDIT (CMA-4.2) ---
    {
        domainCode: "2",
        domainName: "Risk Management, Review & Audit",
        subDomainCode: "2.1",
        subdomainName: "Cybersecurity Risk Management (CMA-4.2.1)",
        controlCode: "CMA-4.2.1.1",
        controlName: "Implement a unified cybersecurity risk assessment methodology to identify, analyze, and process infrastructure and application risks.",
        currentStatusDescription: "Risk register established but not integrated with business systems or audited regularly.",
        controlStatus: "Partially Implemented",
        recommendation: "Integrate the cybersecurity risk register with the corporate ERM software.",
        managementResponse: "ERM integration planned.",
        targetDate: "Q3 2026",
        mappedStandards: {
            nca: "NCA ECC-2.1.1",
            sama: "SAMA CSF-2.5.1",
            iso: "ISO 27001:2022 A.5.7",
            nist: "NIST CSF ID.RA"
        }
    },
    {
        domainCode: "2",
        domainName: "Risk Management, Review & Audit",
        subDomainCode: "2.2",
        subdomainName: "Cybersecurity Review and Audit (CMA-4.2.2)",
        controlCode: "CMA-4.2.2.1",
        controlName: "Execute independent periodic audits of the cybersecurity program separate from the Cybersecurity Department.",
        currentStatusDescription: "External security firm performs annual audit. Internal audit team requires specialized training.",
        controlStatus: "Partially Implemented",
        recommendation: "Develop a continuous compliance monitoring dashboard and upskill internal audit members.",
        managementResponse: "Specialized training approved.",
        targetDate: "Q4 2026",
        mappedStandards: {
            nca: "NCA ECC-2.2.1",
            sama: "SAMA CSF-2.6.1",
            iso: "ISO 27001:2022 A.5.35",
            nist: "NIST CSF ID.IM"
        }
    },

    // --- MAIN DOMAIN 3: OPERATIONAL CYBERSECURITY CONTROLS (CMA-4.3) ---
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.1",
        subdomainName: "Cybersecurity Architecture (CMA-4.3.1)",
        controlCode: "CMA-4.3.1.1",
        controlName: "Design, review, and periodically update cybersecurity architecture incorporating security-by-design principles.",
        currentStatusDescription: "Architecture diagrams exist but lack documentation of security-by-design standards.",
        controlStatus: "Partially Implemented",
        recommendation: "Publish a formal Security Architecture Standard specifying secure landing zones.",
        managementResponse: "Under construction.",
        targetDate: "Q3 2026",
        mappedStandards: {
            nca: "NCA ECC-3.1.1",
            sama: "SAMA CSF-3.2.1",
            iso: "ISO 27001:2022 A.8.20",
            nist: "NIST CSF PR.AC"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.2",
        subdomainName: "Infrastructure Security (CMA-4.3.2)",
        controlCode: "CMA-4.3.2.1",
        controlName: "Secure all infrastructure components, deploy email MFA, anti-spam filters, domain SPF validation, and data backups.",
        currentStatusDescription: "Firewalls, anti-spam, and email MFA implemented. Segregation is logical.",
        controlStatus: "Implemented",
        recommendation: "Ensure 100% of external domains utilize strict SPF/DKIM policies.",
        managementResponse: "Fully implemented and monitored.",
        targetDate: "Compliant",
        mappedStandards: {
            nca: "NCA ECC-3.2.1",
            sama: "SAMA CSF-3.3.1",
            iso: "ISO 27001:2022 A.8.21",
            nist: "NIST CSF PR.IP"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.3",
        subdomainName: "Change and Projects Management (CMA-4.3.3)",
        controlCode: "CMA-4.3.3.1",
        controlName: "Establish change management procedures requiring penetration testing, secure code review, and production environment segregation.",
        currentStatusDescription: "Change management policy is active; however, code reviews are not strictly integrated with CI/CD.",
        controlStatus: "Partially Implemented",
        recommendation: "Implement automated SAST/DAST checks within the CI/CD pipeline.",
        managementResponse: "CI/CD integration in progress.",
        targetDate: "Q3 2026",
        mappedStandards: {
            nca: "NCA ECC-3.3.1",
            sama: "SAMA CSF-3.4.1",
            iso: "ISO 27001:2022 A.8.32",
            nist: "NIST CSF PR.IP"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.4",
        subdomainName: "Identity And Access Management (CMA-4.3.4)",
        controlCode: "CMA-4.3.4.1",
        controlName: "Restrict access on a Need-to-Know/Least Privilege basis, automate IAM, and implement MFA for sensitive/privileged accounts.",
        currentStatusDescription: "Access lists are managed manually. MFA is enabled for VPN but not for all internal servers.",
        controlStatus: "Partially Implemented",
        recommendation: "Implement an automated IAM solution with Role-Based Access Control (RBAC) and universal MFA.",
        managementResponse: "IAM software procurement underway.",
        targetDate: "Q4 2026",
        mappedStandards: {
            nca: "NCA ECC-3.4.1",
            sama: "SAMA CSF-3.5.1",
            iso: "ISO 27001:2022 A.5.15",
            nist: "NIST CSF PR.AC"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.5",
        subdomainName: "Information and Technology Assets Management (CMA-4.3.5)",
        controlCode: "CMA-4.3.5.1",
        controlName: "Maintain a unified record and accurate inventory of all information and technical assets across their lifecycles.",
        currentStatusDescription: "Hardware inventory maintained in spreadsheets; no centralized CMDB.",
        controlStatus: "Partially Implemented",
        recommendation: "Deploy a centralized CMDB to dynamically discover and track assets.",
        managementResponse: "CMDB implementation planned.",
        targetDate: "Q3 2026",
        mappedStandards: {
            nca: "NCA ECC-3.5.1",
            sama: "SAMA CSF-3.6.1",
            iso: "ISO 27001:2022 A.5.9",
            nist: "NIST CSF ID.AM"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.6",
        subdomainName: "Safe Disposal (CMA-4.3.6)",
        controlCode: "CMA-4.3.6.1",
        controlName: "Implement secure disposal standards covering hard copies and digital assets (e.g., secure wiping and degaussing).",
        currentStatusDescription: "Physical paper shredding in place. Hard drive wiping requires formal certification tracking.",
        controlStatus: "Partially Implemented",
        recommendation: "Partner with certified e-waste partners and maintain a central register of cryptographic destruction.",
        managementResponse: "Standardizing disposal tracking.",
        targetDate: "Q2 2026",
        mappedStandards: {
            nca: "NCA ECC-3.6.1",
            sama: "SAMA CSF-3.7.1",
            iso: "ISO 27001:2022 A.8.10",
            nist: "NIST CSF PR.DS"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.7",
        subdomainName: "Cybersecurity Incident Management (CMA-4.3.7)",
        controlCode: "CMA-4.3.7.1",
        controlName: "Develop an Incident Management Process, build a CSIRT/CERT team, establish response plans, and report to CMA immediately.",
        currentStatusDescription: "Incident response plan exists but lack detailed escalation steps for trading system failures.",
        controlStatus: "Partially Implemented",
        recommendation: "Create a playbook for trading outages and conduct annual tabletop simulation exercises.",
        managementResponse: "Playbook drafting in progress.",
        targetDate: "Q4 2026",
        mappedStandards: {
            nca: "NCA ECC-3.7.1",
            sama: "SAMA CSF-3.8.1",
            iso: "ISO 27001:2022 A.5.24",
            nist: "NIST CSF RS.MA"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.8",
        subdomainName: "Cybersecurity Event Logs Management (CMA-4.3.8)",
        controlCode: "CMA-4.3.8.1",
        controlName: "Implement a security event logs management process with central SIEM; retain records for at least 12 months.",
        currentStatusDescription: "Central SIEM ingesting logs. Retention is set to 180 days due to storage limits.",
        controlStatus: "Partially Implemented",
        recommendation: "Expand SIEM storage or configure cold storage archives to comply with the 12-month retention rule.",
        managementResponse: "Storage capacity upgrade requested.",
        targetDate: "Q2 2026",
        mappedStandards: {
            nca: "NCA ECC-3.8.1",
            sama: "SAMA CSF-3.9.1",
            iso: "ISO 27001:2022 A.8.16",
            nist: "NIST CSF DE.AE"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.9",
        subdomainName: "Cybersecurity Threat Management (CMA-4.3.9)",
        controlCode: "CMA-4.3.9.1",
        controlName: "Define and execute a Threat Management process utilizing both internal indicators and external threat intelligence.",
        currentStatusDescription: "No active threat intelligence subscription; relying on open-source feeds.",
        controlStatus: "Partially Implemented",
        recommendation: "Procure a commercial Threat Intelligence feed and integrate with firewalls and SIEM.",
        managementResponse: "Subscription budgeting in process.",
        targetDate: "Q3 2026",
        mappedStandards: {
            nca: "NCA ECC-3.9.1",
            sama: "SAMA CSF-3.10.1",
            iso: "ISO 27001:2022 A.5.7",
            nist: "NIST CSF ID.RA"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.10",
        subdomainName: "Applications Protection (CMA-4.3.10)",
        controlCode: "CMA-4.3.10.1",
        controlName: "Adhere to secure coding standards, conduct annual penetration testing for external services, and protect data privacy.",
        currentStatusDescription: "Annual penetration testing conducted on public portals. Mobile application requires specialized assessment.",
        controlStatus: "Partially Implemented",
        recommendation: "Ensure mobile applications undergo deep binary security analysis and penetration testing before releases.",
        managementResponse: "Mobile VAPT scheduled.",
        targetDate: "Q3 2026",
        mappedStandards: {
            nca: "NCA ECC-3.10.1",
            sama: "SAMA CSF-3.11.1",
            iso: "ISO 27001:2022 A.8.25",
            nist: "NIST CSF PR.IP"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.11",
        subdomainName: "Encryption (CMA-4.3.11)",
        controlCode: "CMA-4.3.11.1",
        controlName: "Define encryption standards for data in transit and at rest, establishing secure encryption key lifecycles.",
        currentStatusDescription: "Databases encrypted at rest. SSL/TLS enforced for all external endpoints.",
        controlStatus: "Implemented",
        recommendation: "Regularly rotate master encryption keys and secure KMS configurations.",
        managementResponse: "Standard key rotations active.",
        targetDate: "Compliant",
        mappedStandards: {
            nca: "NCA ECC-3.11.1",
            sama: "SAMA CSF-3.12.1",
            iso: "ISO 27001:2022 A.8.24",
            nist: "NIST CSF PR.DS"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.12",
        subdomainName: "Vulnerabilities Management (CMA-4.3.12)",
        controlCode: "CMA-4.3.12.1",
        controlName: "Establish a security vulnerabilities management process, performing scans and applying prioritized patches.",
        currentStatusDescription: "Regular infrastructure vulnerability scans performed. Patching timelines are sometimes delayed for legacy hosts.",
        controlStatus: "Partially Implemented",
        recommendation: "Enforce strict patch SLA metrics: critical patches applied within 14 days, high within 30 days.",
        managementResponse: "Patching schedule revised.",
        targetDate: "Q2 2026",
        mappedStandards: {
            nca: "NCA ECC-3.12.1",
            sama: "SAMA CSF-3.13.1",
            iso: "ISO 27001:2022 A.8.8",
            nist: "NIST CSF PR.IP"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.13",
        subdomainName: "E-Trading Services (CMA-4.3.13)",
        controlCode: "CMA-4.3.13.1",
        controlName: "Secure e-trading services with sandboxing, non-caching, man-in-the-middle defenses, and MFA for login and transactions.",
        currentStatusDescription: "MFA active for trading login. SMS transaction alerts contain no sensitive ID or portfolio details.",
        controlStatus: "Implemented",
        recommendation: "Block client accounts automatically after 3 consecutive incorrect password attempts.",
        managementResponse: "Security lockout policy in effect.",
        targetDate: "Compliant",
        mappedStandards: {
            nca: "NCA ECC-3.13.1",
            sama: "SAMA CSF-3.14.1",
            iso: "ISO 27001:2022 A.8.22",
            nist: "NIST CSF PR.DS"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.14",
        subdomainName: "Physical Security (CMA-4.3.14)",
        controlCode: "CMA-4.3.14.1",
        controlName: "Enforce physical entry controls, CCTV surveillance, data room protection, and ongoing fire alarm testing.",
        currentStatusDescription: "Server room access protected by biometric cards. CCTV active with 90-day archive.",
        controlStatus: "Implemented",
        recommendation: "Ensure critical systems are backed by redundant UPS and generators with regular load testing.",
        managementResponse: "Generators load-tested monthly.",
        targetDate: "Compliant",
        mappedStandards: {
            nca: "NCA ECC-3.14.1",
            sama: "SAMA CSF-3.15.1",
            iso: "ISO 27001:2022 A.7.1",
            nist: "NIST CSF PR.PT"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.15",
        subdomainName: "Business Continuity Management (CMA-4.3.15)",
        controlCode: "CMA-4.3.15.1",
        controlName: "Formulate a business continuity policy and conduct annual Business Impact Analysis (BIA) and Disaster Recovery tests.",
        currentStatusDescription: "Disaster recovery site active. DR testing conducted biennially rather than annually.",
        controlStatus: "Partially Implemented",
        recommendation: "Schedule and execute mandatory annual Disaster Recovery simulation drills for trading applications.",
        managementResponse: "Annual DR drill schedule established.",
        targetDate: "Q4 2026",
        mappedStandards: {
            nca: "NCA ECC-3.15.1",
            sama: "SAMA CSF-3.16.1",
            iso: "ISO 27001:2022 A.5.29",
            nist: "NIST CSF RC.RP"
        }
    },
    {
        domainCode: "3",
        domainName: "Operational Controls",
        subDomainCode: "3.16",
        subdomainName: "Use of Personal Devices \"BYOD\" (CMA-4.3.16)",
        controlCode: "CMA-4.3.16.1",
        controlName: "Implement a BYOD policy leveraging Mobile Device Management (MDM) to segregate corporate data and allow remote wiping.",
        currentStatusDescription: "Corporate mail accessible on personal phones. MDM is not yet enrolled for all employees.",
        controlStatus: "Partially Implemented",
        recommendation: "Enforce mandatory MDM registration for any personal device accessing corporate or trading resources.",
        managementResponse: "MDM rollout scheduled.",
        targetDate: "Q3 2026",
        mappedStandards: {
            nca: "NCA ECC-3.16.1",
            sama: "SAMA CSF-3.17.1",
            iso: "ISO 27001:2022 A.8.1",
            nist: "NIST CSF PR.AC"
        }
    },

    // --- MAIN DOMAIN 4: CYBERSECURITY FOR THIRD PARTIES AND SUPPLIERS (CMA-4.4) ---
    {
        domainCode: "4",
        domainName: "Third Parties & Suppliers",
        subDomainCode: "4.1",
        subdomainName: "Contracts and Suppliers Management (CMA-4.4.1)",
        controlCode: "CMA-4.4.1.1",
        controlName: "Ensure third-party suppliers meet minimum cybersecurity controls, executing NDAs, risk-based tests, and SLAs.",
        currentStatusDescription: "Vendors sign standard contracts, but active cybersecurity risk assessments are not conducted during bidding.",
        controlStatus: "Partially Implemented",
        recommendation: "Deploy a vendor risk assessment questionnaire and perform security reviews before signing contracts.",
        managementResponse: "Vendor onboarding process is being updated.",
        targetDate: "Q4 2026",
        mappedStandards: {
            nca: "NCA ECC-4.1.1",
            sama: "SAMA CSF-4.1.1",
            iso: "ISO 27001:2022 A.5.19",
            nist: "NIST CSF ID.SC"
        }
    },
    {
        domainCode: "4",
        domainName: "Third Parties & Suppliers",
        subDomainCode: "4.2",
        subdomainName: "Outsourcing (CMA-4.4.2)",
        controlCode: "CMA-4.4.2.1",
        controlName: "Define outsourcing policies, ensuring security operations monitoring is restricted to providers within the Kingdom (KSA).",
        currentStatusDescription: "Our SOC provider is situated in KSA, fully compliant with national sovereignty rules.",
        controlStatus: "Implemented",
        recommendation: "Perform annual audits on the localized SOC facility.",
        managementResponse: "Localized SOC validated.",
        targetDate: "Compliant",
        mappedStandards: {
            nca: "NCA ECC-4.2.1",
            sama: "SAMA CSF-4.2.1",
            iso: "ISO 27001:2022 A.5.21",
            nist: "NIST CSF ID.SC"
        }
    },
    {
        domainCode: "4",
        domainName: "Third Parties & Suppliers",
        subDomainCode: "4.3",
        subdomainName: "Cloud Computing (CMA-4.4.3)",
        controlCode: "CMA-4.4.3.1",
        controlName: "Verify cloud hosting is located in KSA; ensure data segregation, right-to-audit, and unrecoverable deletion on termination.",
        currentStatusDescription: "All corporate cloud environments hosted in KSA-based regions. Security reviews completed.",
        controlStatus: "Implemented",
        recommendation: "Ensure contracts explicitly cover post-termination data recovery formats and unrecoverable deletion validation.",
        managementResponse: "Verified with Cloud Provider.",
        targetDate: "Compliant",
        mappedStandards: {
            nca: "NCA ECC-4.3.1",
            sama: "SAMA CSF-4.3.1",
            iso: "ISO 27001:2022 A.5.22",
            nist: "NIST CSF ID.SC"
        }
    }
];
