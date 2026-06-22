
import { AIService } from './aiService';
import type { GRCAgentDecision, GRCComplianceStatus, GRCNFAAction, GRCAgentRole, GRCMeetingMessage, GRCAnalysisModels, GRCMOM } from '../types';
import { sampleCyberSkills, CYBER_DOMAINS, ALL_CYBER_SKILLS_COUNT, CORE_DOMAINS_COUNT } from '../data/cybersecuritySkills';

export interface OrchestratorDecision {
    summary: string;
    riskLevel: 'low' | 'medium' | 'high';
    complianceStatus: GRCComplianceStatus;
    nfa: Omit<GRCNFAAction, 'id' | 'decisionId' | 'createdAt'>[];
    agentTrace: { agentRole: GRCAgentRole; reasoning: string; speakerName: string }[];
    meetingTranscript?: GRCMeetingMessage[];
    analysis?: GRCAnalysisModels;
    mom?: GRCMOM;
}

export class AgentService {
    // Specialized Agents System Prompts
    private static PROMPTS = {
        ORCHESTRATOR: (companyName: string, selectedFramework: string, prevMOM?: GRCMOM) => `
            You are the GRC Orchestrator for ${companyName}.
            Current Framework: ${selectedFramework || 'NONE SELECTED'}.
            
            PREVIOUS MEETING MINUTES (MOM) SUMMARY:
            ${prevMOM ? JSON.stringify(prevMOM) : 'No previous meeting history found.'}
            
            **INTEGRATED AGENTIC KNOWLEDGE BASE - SOVEREIGN CYBERSECURITY SKILLS LIBRARY:**
            - **Repository Source:** https://github.com/mukul975/Anthropic-Cybersecurity-Skills.git
            - **Total Production-Ready Skills:** ${ALL_CYBER_SKILLS_COUNT} Sovereign Cognitive Capsules
            - **Specialized Cyber Domains:** ${CORE_DOMAINS_COUNT} Core Technical Domains (including Cloud Security, DevSecOps, Crytography, AI Safety, Threat Hunting, GRC, BCM, and privacy)
            - **Strategic Framework Mappings:**
              * **NCA ECC (National Cybersecurity Authority Essential Cybersecurity Controls)**: Enforces network isolation, secure OS configurations, patching, containment, identity segregation, and credential protection.
              * **SAMA CSF (Saudi Central Bank CSF)**: Demands TLS/AES envelopments, cryptographic key lifecycles, active monitoring, network architectures, and multi-factor conditional setups.
              * **PDPL (Saudi Personal Data Protection Law)**: Demands strict data pseudonymization, irreversible masking, data-flow logging, consent boundaries, and DSAR pipelines.
              * **CMA (Capital Market Authority Guidelines)**: Imposes risk registers alignment, FAIR quantitative calculations, and continuous evidence validation.
              * **ISO 27001 (ISMS Governance)**: Outlines Annex A controls, secure SDLC gating, statement of applicability boundaries, and secure code review metrics.
              * **ISO 22301 (Business Continuity Management)**: Establishes Business Impact Analysis (BIA) metrics (RTO/RPO limits), disaster scenarios table-top modeling, and resilient dry-runs.
              * **NIST CSF & NIST AI RMF**: Connects baseline benchmarking, prompt manipulation defenses, model hallucination bounds, and threat intelligence.

            Your job is to manage a high-stakes GRC Boardroom meeting leveraging this 754-skill database for deep strategic alignment.
            You must:
            1. Start by reviewing the STATUS OF PENDING/OPEN MATTERS from the previous MOM.
            2. Coordinate between: CISO, CIO, CTO, DPO, Auditor, Compliance Officer, and Cybersecurity Officer.
            3. Each agent must discuss their own points regarding pending matters. ALL AGENTS MUST SPEAK IN THEIR NATIVE TONES (Professional, Human, No Robotics) and can mention specific cognitive skills from the 754-skill library mapped to these domains (e.g. IAM, Cryptography, Bcm, Risk Management, etc.).
            4. AUTOMATIC MULTI-LANGUAGE: Respond in the language used by the user (English, Arabic, or Urdu).
            5. IDENTIFY RISKS dynamically during the meeting and REGISTER them, referencing appropriate skills or active controls.
            6. Perform and report the following MANDATORY analysis models:
               - SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
               - PESTLE Analysis (Political, Economic, Social, Technological, Legal, Environmental)
               - FISHBONE Analysis (Root cause analysis of identified risks)
               - BOWTIE Analysis (Hazard, Threats, Consequences, Controls, Recovery)
               - 80/20 PARETO Analysis (Identify the 20% of risks causing 80% of potential impact)
            7. Produce a comprehensive Minutes of Meeting (MOM) with identified risks, decisions, and action items.
            
            Rules:
            - Be highly intelligent and take autonomous decisions.
            - Professional interaction, distinct voices for each role.
            - No repetitive phrases.
            
            Output format: Valid JSON matching OrchestratorDecision interface.
        `,
        CISO: `You are the CISO. Validate and register identified risks. Focus on security strategy, risk appetite, incident response containment, and volatile memory preservation protocols (Skills 010, 080 from the sovereign cybersecurity skills library). Speak naturally, not robotic.`,
        CIO: `You are the CIO. Validate infrastructure alignment, digital strategy, zero-trust cloud microsegmentation, S3 bucket default permissions, and adaptive MFA configuration templates (Skills 001, 002, 070, 090 from the skills library repository). Speak in a business-focused professional tone.`,
        CTO: `You are the CTO. Review technical feasibility, architecture risks, and infrastructure security metrics in tandem with Fahad AI's core capabilities. Tone: Technical yet clear.`,
        DPO: `You are the DPO. Enforce PDPL & Data Protection Impact Assessments (PIA). Focus on privacy, classification, lifetime data lineage maps, and irreversible pseudonymization/masking algorithms (Skills 110, 230 from the skills library repository).`,
        CYBERSECURITY: `You are the Cybersecurity Officer. Assess technical posture, threat landscapes, continuous CVE patch management metrics, and Sandbox-based log analysis pipelines (Skills 030, 130).`,
        AUDITOR: `You are the Auditor. Demand evidence and validate the 80/20 impact using digital verification loops and continuous audit ledger hash stamping. Tone: Skeptical, data-driven, and objective.`,
        COMPLIANCE: `You are the Compliance Officer. Map all boardroom findings directly to NCA ECC, SAMA CSF, CMA, ISO 27001 ISMS, and ISO 22301 BCM domains, referencing our integrated 754-skill database.`
    };

    /**
     * Conducts a highly intelligent GRC meeting with advanced risk analysis.
     */
    static async conductMeeting(
        userRequest: string, 
        context: { 
            company: any, 
            users: any[], 
            assessments: any,
            documents: any[],
            prevMOM?: GRCMOM
        }
    ): Promise<OrchestratorDecision> {
        const companyName = context.company?.name || "The Organization";
        const selectedFramework = context.assessments?.selectedFramework || "None";
        
        console.log(`Starting Advanced GRC Governance Meeting for ${companyName}...`);

        const prompt = `
            USER REQUEST/INPUT: "${userRequest}"
            STAKEHOLDERS: ${JSON.stringify(context.users.map(u => ({ name: u.name, role: u.role })))}
            
            CONTEXT:
            - Framework: ${selectedFramework}
            - Previous MOM: ${JSON.stringify(context.prevMOM)}
            - Documents: ${context.documents.length}
            - Assessments: ${JSON.stringify(context.assessments)}

            Simulate a realistic boardroom interaction. 
            Identify at least 2 new risks.
            Perform SWOT, PESTLE, Fishbone, Bowtie, and Pareto analysis.
            Generate a full MOM with pending actions.
        `;

    const loadAgentDecision = async () => {
        if (!window.navigator.onLine) {
            const localResponse = await import('./localLLM').then(m => m.LocalLLM.generateResponse(userRequest));
            try {
                return JSON.parse(localResponse) as OrchestratorDecision;
            } catch {
                // Return a basic fallback structure if local response isn't JSON
                return {
                    summary: localResponse,
                    riskLevel: 'low',
                    complianceStatus: 'undetermined',
                    nfa: [{ action: "Check connectivity for full GRC Boardroom meeting.", priority: "medium", status: "open" }],
                    agentTrace: [{ agentRole: "Orchestrator", speakerName: "Rashid (Local)", reasoning: "Running in offline mode due to no connectivity." }],
                    analysis: {},
                    mom: { id: "offline-" + Date.now(), meetingDate: Date.now(), participants: [], discussionPoints: ["Operating in Offline Mode"], identifiedRisks: [], decisions: [], pendingActions: [] }
                } as any as OrchestratorDecision;
            }
        }

        return await AIService.generateStructuredContent<OrchestratorDecision>(
            prompt,
            {
                type: "object",
                properties: {
                    summary: { type: "string" },
                    riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                    complianceStatus: { type: "string", enum: ["compliant", "non-compliant", "undetermined"] },
                    nfa: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                action: { type: "string" },
                                priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                                status: { type: "string", enum: ["open", "in_progress", "done"] }
                            },
                            required: ["action", "priority", "status"]
                        }
                    },
                    agentTrace: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                agentRole: { type: "string" },
                                speakerName: { type: "string" },
                                reasoning: { type: "string" }
                            }
                        }
                    },
                    analysis: {
                        type: "object",
                        properties: {
                            swot: { $ref: "#/definitions/swot" },
                            pestle: { $ref: "#/definitions/pestle" },
                            fishbone: { $ref: "#/definitions/fishbone" },
                            bowtie: { $ref: "#/definitions/bowtie" },
                            pareto8020: { $ref: "#/definitions/pareto" }
                        }
                    },
                    mom: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            meetingDate: { type: "number" },
                            participants: { type: "array", items: { type: "object", properties: { role: { type: "string" }, name: { type: "string" } } } },
                            discussionPoints: { type: "array", items: { type: "string" } },
                            identifiedRisks: { type: "array", items: { type: "object", properties: { title: { type: "string" }, level: { type: "string" } } } },
                            decisions: { type: "array", items: { type: "string" } },
                            pendingActions: { type: "array", items: { type: "object", properties: { action: { type: "string" }, assignee: { type: "string" }, dueDate: { type: "number" }, status: { type: "string" } } } }
                        }
                    }
                },
                required: ["summary", "riskLevel", "complianceStatus", "nfa", "agentTrace", "analysis", "mom"]
            },
            'gemini-2.5-flash',
            this.PROMPTS.ORCHESTRATOR(companyName, selectedFramework, context.prevMOM)
        );
    };

    const decision = await loadAgentDecision();
    return decision;
    }
}
