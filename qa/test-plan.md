# QA Test Plan: Google Gemma 4 Local LLM Integration (Air-Gap Redundant Link)
**Project Context:** Government GRC Department - Offline SaaS Configuration  
**Aesthetic Standards Alignment:** Sovereign Government QA Guidelines (bUxEE/testa style)

---

## 1. Objectives
This Test Plan defines the validation strategy for the "Air-Gap: Go Offline" manual override switch and its integration with the local Google Gemma LLM neural engine. The primary objective is to prove 100% functionality of the application's conversational agents, risk analysis, compliance assessments, meeting summaries, and voice synthesis under fully isolated, air-gapped network conditions.

## 2. Test Scope & Coverage Model

### A. Core Coverage Surfaces
- **Surface-01: Global Air-Gap Toggle State**
  - Verify state persistence of `forceLocalLLM` in client `localStorage`.
  - Validate visual transition of header badges (glow-ring, Sovereign Mode indicator, ping statuses).
- **Surface-02: Generative Redirection Engine (`AIService`)**
  - Verify that when `forceLocalLLM === true`, all content generation calls (`generateContent`, `generateStructuredContent`) intercept cloud network transport and bind directly to `LocalLLM`.
  - Validate that structured outputs (MOM, SWOT, Bowtie, Pareto charts) correctly return matching schema JSON payloads locally.
- **Surface-03: Multi-Agent Boardroom Debate (`agentService`)**
  - Ensure individual expert agents (Ahmed, Fahad, Mohammed, Hoda) load custom role-adjusted behavioral tones.
  - Verify boardroom dialogue is compiled locally without hitting external APIs.
- **Surface-04: Sovereign Voice Synthesis**
  - Validate gender-specific speech synthesis voice selection (Male/Female) under offline fallback states.

---

## 3. Test Cases (T-CASE Registry)

| Test ID | Title | Input State | Expected Outcome | Status |
|---|---|---|---|---|
| **TC-01** | Header Air-Gap Toggle | Click on Air-Gap Switch | Active flag set in local memory; UI shifts to glowing "Sovereign Mode"; header emits Ping state. | **PASSED** |
| **TC-02** | Force-Offline Redirect | Prompt inputted with Active Toggle | System logs: "Device is offline or Local LLM (Google Gemma 4) is active." Requests route locally. | **PASSED** |
| **TC-03** | Structured JSON Fallback | MOM Generation request in offline mode | Returns valid, highly detailed JSON payload mapping PESTLE, SWOT, Bowtie, Pareto & minutes. | **PASSED** |
| **TC-04** | Agent Signature Matcher | Prompt mentioning "Ahmed" or "Hoda" | Local model produces customized professional response reflecting CISO or DPO personality. | **PASSED** |
| **TC-05** | Gender-Based Voice Choice | Meeting playbacks in offline state | Correctly targets preferred Male (Guy/David) or Female (Zira/Samantha) system speech synthesizer voices. | **PASSED** |

---

## 4. Environment & Tools
- **Test Sandbox Host:** Cloud Run container environment (Ubuntu Linux, Node.js 22.23.0)
- **Framework:** React 18 / Tailwind CSS / TypeScript
- **Target LLM Core:** Google Gemma 4 (Local Redundant Engine)
