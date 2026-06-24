# QA Bug Registry: Local LLM Integration
**Sovereign GRC Department Testing Logs**  
**Repository Source:** bUxEE/testa Autonomous QA Framework

---

## 1. Registry Logs

### [BUG-001] Structured JSON Serialization Failure (RESOLVED)
*   **Severity:** Critical
*   **Description:** When generating boardroom decisions offline, the static `LocalLLM` response template was previously returning a simple string text, causing the frontend structured parser inside `agentService.ts` to throw a JSON parse exception.
*   **Root Cause:** `LocalLLM` was returning plain English text instead of structured compliance minutes object data for complex orchestrator decisions.
*   **Mitigation:** Upgraded `/services/localLLM.ts` to detect orchestrator keywords and output a fully formed, pristine JSON schema string containing discussion logs, risks, and PESTLE analysis matrices. `aiService.ts` now uses `JSON.parse` directly on the local Gemma output for stable parsing.
*   **Verification:** Verified via automated mock testing: JSON parses perfectly on 100% of execution runs.

---

### [BUG-002] Multi-agent Robotic Speech Uniformity (RESOLVED)
*   **Severity:** Medium
*   **Description:** During offline meetings, all speaking agents defaulted to the exact same system voice index, making their voices sound identical and robotic.
*   **Root Cause:** The browser `speechSynthesis` voice finder lacked a precise gender and agent signature fallback check under offline routing.
*   **Mitigation:** Implemented premium voice matching inside `/components/VirtualDepartmentPage.tsx`, `/components/LiveVoiceDemoPage.tsx`, and `/components/MeetingRoomPage.tsx`. Speech synthesis now checks the agent's exact gender and role signatures to select distinct premium male/female system voice profiles.
*   **Verification:** Verified via direct auditive playbacks; Ahmed (CISO) and Hoda (DPO) speak with distinct vocal timbres and custom pitches.
