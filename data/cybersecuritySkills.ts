export interface CyberSkill {
    id: string;
    title: string;
    domain: string;
    description: string;
    targetFrameworks: string[];
    technicalAction: string;
    agentOwnerId: string; // ID of the agent in virtualAgents that specializes in this skill
}

export const CYBER_DOMAINS = [
    "Cloud Security",
    "Digital Forensics",
    "Cryptography",
    "Malware Analysis",
    "DevSecOps & Secure SDLC",
    "GRC & Risk Management",
    "Threat Hunting",
    "Network Security",
    "Incident Response",
    "Identity & Access Management (IAM)",
    "Penetration Testing",
    "Data Protection & Privacy",
    "Application Security",
    "Vulnerability Management",
    "Security Architecture",
    "OS Hardening & Linux Security",
    "AI Safety & NIST AI RMF",
    "Threat Intelligence",
    "Audit & Compliance Tracking",
    "Infrastructure Sec Audit",
    "Continuous Security Monitoring",
    "Business Continuity (ISO 22301)",
    "ISMS Governance (ISO 27001)",
    "NIST CSF Benchmarking",
    "Privacy Governance (PDPL)",
    "Secure Code Review & Refactoring"
];

export const ALL_CYBER_SKILLS_COUNT = 754;
export const CORE_DOMAINS_COUNT = 26;

export const sampleCyberSkills: CyberSkill[] = [
    // Cloud Security
    {
        id: "skill-001",
        title: "IAM Role-Assumption Audit & Multi-Cloud Identity Mapping",
        domain: "Cloud Security",
        description: "Verify AWS assume-role relations and cross-account trust boundaries to prevent privilege escalation via stale external IDs or backdoored trust relationships.",
        targetFrameworks: ["MITRE ATT&CK T1078.004", "NIST CSF PR.AC-1"],
        technicalAction: "Inspect credential paths, evaluate 'sts:AssumeRole' permissions across tenant boundaries, and audit external ID requirements.",
        agentOwnerId: "agent-cio"
    },
    {
        id: "skill-002",
        title: "S3 Bucket & GCP Cloud Storage Permissions Alignment",
        domain: "Cloud Security",
        description: "Enforce Private-by-Default storage controls. Parse IAM bucket policies and prevent unexpected wildcard principal exposures (*).",
        targetFrameworks: ["NIST CSF PR.DS-1", "ISO 27001 A.8.12"],
        technicalAction: "Run storage API simulations to verify that block-public-access attributes are strictly applied programmatically.",
        agentOwnerId: "agent-cio"
    },
    // Digital Forensics
    {
        id: "skill-010",
        title: "Volatile Memory Acquirement & GRC Evidence Validation",
        domain: "Digital Forensics",
        description: "Create cryptographically valid memory dumps (using LiME/Volatility) format-aligned with strict regulatory evidence chain-of-custody requirements.",
        targetFrameworks: ["MITRE T1046", "ISO 27001 A.5.24"],
        technicalAction: "Execute bit-stream preservation tools, generate SHA-256 hashes immediately on acquisition, and record on the immutable registry ledger.",
        agentOwnerId: "agent-ciso"
    },
    // Cryptography
    {
        id: "skill-020",
        title: "Quantum-Resistant Envelope Encryption & HSM Lifecycle Management",
        domain: "Cryptography",
        description: "Design dual-layer symmetric keyring architectures utilizing AES-GCM-256 and verified TLS cipher suites, avoiding deprecated RC4 or 3DES curves.",
        targetFrameworks: ["NIST SP 800-53 SC-13", "SAMA CSF 3.2.10"],
        technicalAction: "Enforce automated key rotation schedules under envelope security and configure cloud-HSM storage endpoints.",
        agentOwnerId: "agent-cio"
    },
    // Malware Analysis
    {
        id: "skill-030",
        title: "Dynamic Sandbox Execution & API Signature Analysis",
        domain: "Malware Analysis",
        description: "Isolate suspicious executable binaries in controlled execution environments to intercept network calls, registry writes, and heap allocations.",
        targetFrameworks: ["MITRE T1059", "NCA ECC-2-12"],
        technicalAction: "Construct custom Yara rules mapping sandbox indicators directly to threat intelligence command channels.",
        agentOwnerId: "agent-ciso"
    },
    // DevSecOps & Secure SDLC
    {
        id: "skill-040",
        title: "Infrastructure as Code (IaC) Static Analysis Pipeline",
        domain: "DevSecOps & Secure SDLC",
        description: "Integrate automatic security checks into CI/CD workflows using Checkov or tfsec to detect public buckets, open security groups, and default root keys before deployments.",
        targetFrameworks: ["ISO 27001 A.8.25", "NCA ECC-2-14"],
        technicalAction: "Enforce branch-protection thresholds to block merge actions if critical configuration vulnerabilities are detected.",
        agentOwnerId: "agent-codereviewer"
    },
    // GRC & Risk Management
    {
        id: "skill-050",
        title: "Quantitative Risk Modeling (FAIR Framework Integration)",
        domain: "GRC & Risk Management",
        description: "Translate subjective qualitative audit heatmaps into precise annualized loss expectancy (ALE) bounds using statistical loss events calculations.",
        targetFrameworks: ["ISO 31000", "NIST CSF GV.RM"],
        technicalAction: "Perform Monte Carlo scenario modeling utilizing historical threat frequencies to validate remediation budgets quantitatively.",
        agentOwnerId: "agent-charon"
    },
    // Threat Hunting
    {
        id: "skill-060",
        title: "Sysmon Event-Log Threat Triage & DLL Sideloading Detection",
        domain: "Threat Hunting",
        description: "Construct advanced Elastic/Splunk query strings to detect unscheduled system drivers writing files to vulnerable directories (System32 / Temp).",
        targetFrameworks: ["MITRE T1574.002", "NIST CSF DE.AE-1"],
        technicalAction: "Review Event ID 1 (Process Creation) alongside Event ID 7 (Image Loaded) to alert on anomalous system executions.",
        agentOwnerId: "agent-ciso"
    },
    // Network Security
    {
        id: "skill-070",
        title: "Zero-Trust Microsegmentation & Packet Flow Verification",
        domain: "Network Security",
        description: "Enforce stateful, context-aware routing filters between production DB tiers and external facing microservices.",
        targetFrameworks: ["NIST SP 800-207", "NCA ECC-2-8"],
        technicalAction: "Deploy and audit service-mesh mTLS policies with granular client certificate controls.",
        agentOwnerId: "agent-cio"
    },
    // Incident Response
    {
        id: "skill-080",
        title: "Ransomware Containment Playbook Orchestration",
        domain: "Incident Response",
        description: "Incorporate rapid API block triggers to quarantine affected cloud subnets and revoke credential tokens immediately upon continuous detection thresholds.",
        targetFrameworks: ["NIST SP 800-61", "ISO 27001 A.5.26"],
        technicalAction: "Initiate host-containment APIs across endpoint solutions, freeze Active Directory sessions, and deploy snapshot retention playbooks.",
        agentOwnerId: "agent-ciso"
    },
    // Identity & Access Management (IAM)
    {
        id: "skill-090",
        title: "Adaptive MFA Enforcements & Session Cookie Hardening",
        domain: "Identity & Access Management (IAM)",
        description: "Configure conditional access policies based on localized corporate IPs, device health indicators, and user risk attributes.",
        targetFrameworks: ["MITRE T1556", "SAMA CSF 3.2.4"],
        technicalAction: "Analyze auth tokens for token-theft resistance and enforce FIDO2 WebAuthn authentication protocols with absolute cookie security.",
        agentOwnerId: "agent-cio"
    },
    // Penetration Testing
    {
        id: "skill-100",
        title: "Active Directory Kerberoasting & Privilege Remediation",
        domain: "Penetration Testing",
        description: "Utilize attack methodologies to identify Active Directory service accounts leveraging low-entropy passwords to draft security defenses.",
        targetFrameworks: ["MITRE T1558.003", "NCA ECC-2-3"],
        technicalAction: "Map service principal name exposure and draft mitigation guidelines enforcing AES256 ticket encryption.",
        agentOwnerId: "agent-ciso"
    },
    // Data Protection & Privacy
    {
        id: "skill-110",
        title: "Personal Data Pseudonymization & Cryptographic Masking",
        domain: "Data Protection & Privacy",
        description: "Review databases housing PII/PDPL regulated entities, injecting automated irreversible field-level masking.",
        targetFrameworks: ["PDPL Article 16", "NIST Privacy Framework"],
        technicalAction: "Map data schema schemas to dynamic tokenization systems to limit raw database cleartext exposures.",
        agentOwnerId: "agent-dpo"
    },
    // Application Security
    {
        id: "skill-120",
        title: "API Gateway Authorization Token Validation",
        domain: "Application Security",
        description: "Block broken object-level authorization (BOLA) attempts by ensuring gateway engines enforce cryptographic matching on query parameters against user claims.",
        targetFrameworks: ["OWASP API-1", "ISO 27001 A.8.28"],
        technicalAction: "Construct JSON schema verification logic inside gateway routes to sanitize client content types.",
        agentOwnerId: "agent-codereviewer"
    },
    // Vulnerability Management
    {
        id: "skill-130",
        title: "Continuous CVE Remediation Staging",
        domain: "Vulnerability Management",
        description: "Assess external system dependencies against known CVE databases recursively, ranking vulnerability level using localized network vectors.",
        targetFrameworks: ["NIST CSF PR.IP-12", "NCA ECC-2-3"],
        technicalAction: "Schedule dynamic micro-patches for high-severity issues on low-production nodes to guarantee continuity.",
        agentOwnerId: "agent-cso"
    },
    // AI Safety & NIST AI RMF
    {
        id: "skill-140",
        title: "Prompt Injection Defenses & LLM Input Sanitization",
        domain: "AI Safety & NIST AI RMF",
        description: "Implement defense-in-depth sanitization chains to identify and strip malicious instructions prior to processing by LLMAgents.",
        targetFrameworks: ["NIST AI RMF G-4", "OWASP Top 10 for LLMs"],
        technicalAction: "Evaluate input vectors utilizing specialized toxic/malicious check model classifiers to strip systemic prompt bypass requests.",
        agentOwnerId: "agent-nist"
    },
    {
        id: "skill-141",
        title: "Model Output Guardrails & Hallecution Risk Benchmarking",
        domain: "AI Safety & NIST AI RMF",
        description: "Benchmark generative output against established organizational facts to prevent systemic hallucinations and factual mismatch in reports.",
        targetFrameworks: ["NIST AI RMF MEASURE-1", "ISO 42001"],
        technicalAction: "Validate response entities through verified RAG grounding queries against pre-approved GRC corporate templates.",
        agentOwnerId: "agent-nist"
    },
    // Business Continuity (ISO 22301)
    {
        id: "skill-200",
        title: "Critical Business Impact Analysis (BIA) modeling",
        domain: "Business Continuity (ISO 22301)",
        description: "Perform systematic assessment of critical enterprise services to define target recovery times (RTO) and point tolerances (RPO).",
        targetFrameworks: ["ISO 22301 Clause 8.2", "NCA ECC-2-11"],
        technicalAction: "Map interdependencies between systems, power grids, third-party APIs, and regional backup centers.",
        agentOwnerId: "agent-bcm"
    },
    {
        id: "skill-201",
        title: "Crisis Tabletop Simulation Design & Dry-run Analysis",
        domain: "Business Continuity (ISO 22301)",
        description: "Formulate crisis simulation environments modeling blackouts, ransomware locks, or data center failures to evaluate incident command systems.",
        targetFrameworks: ["ISO 22301 Clause 8.5", "SAMA CSF 3.2.14"],
        technicalAction: "Facilitate playbooks updates, coordinate testing with key authorities, and document corrective actions lists.",
        agentOwnerId: "agent-bcm"
    },
    // ISMS Governance (ISO 27001)
    {
        id: "skill-210",
        title: "Statement of Applicability (SoA) Management",
        domain: "ISMS Governance (ISO 27001)",
        description: "Synthesize the applicability list of Information Security controls against current infrastructure, outlining detailed reasons for exclusions.",
        targetFrameworks: ["ISO/IEC 27001:2022 Clause 6.1.3", "NCA ECC-1-2"],
        technicalAction: "Maintain control mappings to ISO 27001 Annex A, tracking real-time proof-of-work documents.",
        agentOwnerId: "agent-iso27001"
    },
    // NIST CSF Benchmarking
    {
        id: "skill-220",
        title: "NIST CSF 2.0 Tiers & Profiling baseline mapping",
        domain: "NIST CSF Benchmarking",
        description: "Establish and gauge current security posture profiles against the draft target posture tiers to prioritize organizational investments.",
        targetFrameworks: ["NIST CSF 2.0 GV.PO", "NIST SP 800-53"],
        technicalAction: "Conduct continuous automated reviews of domain parameters, security controls, and resource levels.",
        agentOwnerId: "agent-nist"
    },
    // Privacy Governance (PDPL)
    {
        id: "skill-230",
        title: "Privacy-by-Design Data Lifecycle Mapping",
        domain: "Privacy Governance (PDPL)",
        description: "Map data lifecycle paths from consumer request through processing, database retention, archiving, and final deletion.",
        targetFrameworks: ["PDPL Executive Regulation", "GDPR Article 25"],
        technicalAction: "Review data flow maps, evaluate data retention durations, and run compliance script audits on DB clearings.",
        agentOwnerId: "agent-dpo"
    },
    // Secure Code Review & Refactoring
    {
        id: "skill-240",
        title: "Static Security Verification of Critical Web Code",
        domain: "Secure Code Review & Refactoring",
        description: "Analyze code lines for memory-leak bugs, SQL injection flaws, broken authorization assertions, and lack of input schemas.",
        targetFrameworks: ["OWASP Top 10", "ISO 27001 A.8.28"],
        technicalAction: "Refactor insecure code, configure automated gatekeeper tools, and audit node module dependencies.",
        agentOwnerId: "agent-codereviewer"
    }
];
