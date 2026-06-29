/**
 * GRC Live Gemini Speech & Natural Voice Service (live.gemini.ts)
 * 
 * Provides professional natural human voices, role-based speech synthesis tuning,
 * and immediate human-in-the-loop interruption handling.
 */

export interface VoiceConfig {
    pitch: number;
    rate: number;
    voiceNameKeywords: string[];
}

const ROLE_VOICE_CONFIGS: Record<string, VoiceConfig> = {
    CISO: { pitch: 0.94, rate: 0.94, voiceNameKeywords: ['natural', 'neural', 'david', 'google us english', 'microsoft david', 'guy', 'stefan'] },
    CIO: { pitch: 1.05, rate: 1.01, voiceNameKeywords: ['natural', 'neural', 'google', 'apple', 'george', 'mark', 'tarif'] },
    CTO: { pitch: 0.88, rate: 1.05, voiceNameKeywords: ['natural', 'neural', 'puck', 'apple', 'microsoft', 'shakir', 'riyad'] },
    CGO: { pitch: 1.10, rate: 0.95, voiceNameKeywords: ['natural', 'neural', 'zira', 'siri', 'samantha', 'susan', 'hoda', 'laila'] }, // Sara (Female CGO)
    DPO: { pitch: 1.15, rate: 0.98, voiceNameKeywords: ['natural', 'neural', 'hazel', 'mary', 'kore', 'muna', 'zeina', 'nadia'] }, // Noora (Female DPO)
    CRO: { pitch: 0.92, rate: 0.92, voiceNameKeywords: ['natural', 'neural', 'charon', 'david', 'hassan', 'omar', 'imran'] }, // Rashid (Male CRO)
    CCO: { pitch: 1.02, rate: 1.00, voiceNameKeywords: ['natural', 'neural', 'microsoft', 'google', 'bilal', 'sajid'] }, // Asaad (Male CCO)
    CIA: { pitch: 0.96, rate: 0.96, voiceNameKeywords: ['natural', 'neural', 'george', 'stefan', 'guy'] }, // Abdullah (Male CIA)
    CQO: { pitch: 0.89, rate: 1.02, voiceNameKeywords: ['natural', 'neural', 'puck', 'david', 'mark'] }, // Khalid (Male CQO)
};

export class LiveGeminiVoiceService {
    private static activeUtterance: SpeechSynthesisUtterance | null = null;
    private static onInterruptCallback: (() => void) | null = null;

    /**
     * Set a callback to run when the user interrupts the AI
     */
    static setOnInterrupt(callback: () => void) {
        this.onInterruptCallback = callback;
    }

    /**
     * Stops any currently active speech synthesis immediately
     */
    static interrupt() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            if (window.speechSynthesis.speaking) {
                console.log("🎙️ [Live Interruption] Human intervened. Complying with user and stopping voice immediately.");
                window.speechSynthesis.cancel();
                this.activeUtterance = null;
                if (this.onInterruptCallback) {
                    this.onInterruptCallback();
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Synthesizes text using a high-fidelity, natural human voice profile
     */
    static speak(text: string, role: string, gender?: 'male' | 'female', language: string = 'en-US'): Promise<void> {
        return new Promise<void>((resolve) => {
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
                resolve();
                return;
            }

            // Always interrupt prior speech before starting new speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            this.activeUtterance = utterance;

            const voicesList = window.speechSynthesis.getVoices();

            // Detect language of the text
            const isArabicText = /[\u0600-\u06FF]/.test(text);
            let langPattern = 'en';
            if (isArabicText) {
                langPattern = language.startsWith('ur') ? 'ur' : 'ar';
            } else if (language.startsWith('ur')) {
                langPattern = 'ur';
            } else if (language.startsWith('ar')) {
                langPattern = 'ar';
            }

            // Filter voices by language
            let langVoices = voicesList.filter(v => 
                v.lang.toLowerCase().startsWith(langPattern) || 
                v.lang.toLowerCase().includes(langPattern + '-')
            );

            if (langVoices.length === 0) {
                langVoices = voicesList.filter(v => v.lang.toLowerCase().startsWith('en'));
            }

            // Get role configuration
            const upperRole = role.toUpperCase();
            const config = ROLE_VOICE_CONFIGS[upperRole] || {
                pitch: 1.0,
                rate: 1.0,
                voiceNameKeywords: ['natural', 'neural', 'google', 'apple', 'microsoft']
            };

            const isFemale = gender === 'female' || upperRole === 'DPO' || upperRole === 'CGO' || role.toLowerCase().includes('protection');

            // Segment into male/female pools
            const femaleKeywords = ['female', 'zira', 'hazel', 'susan', 'siri', 'samantha', 'mary', 'kore', 'heera', 'muna', 'hoda', 'laila', 'zeina', 'nadia', 'salma', 'asma', 'uzma', 'zoya', 'aisha'];
            const maleKeywords = ['male', 'david', 'guy', 'stefan', 'george', 'mark', 'puck', 'charon', 'tarif', 'shakir', 'riyad', 'hassan', 'omar', 'imran', 'bilal', 'sajid'];

            const femaleVoices = langVoices.filter(v => 
                femaleKeywords.some(kw => v.name.toLowerCase().includes(kw))
            );
            const maleVoices = langVoices.filter(v => 
                maleKeywords.some(kw => v.name.toLowerCase().includes(kw))
            );

            // Filter out robotic or low-quality local legacy voices
            const filterRobotic = (list: SpeechSynthesisVoice[]) => {
                const highQuality = list.filter(v => {
                    const name = v.name.toLowerCase();
                    return name.includes('natural') || 
                           name.includes('neural') || 
                           name.includes('google') || 
                           name.includes('apple') || 
                           name.includes('microsoft') || 
                           name.includes('premium') || 
                           name.includes('siri') ||
                           name.includes('cortana');
                });
                if (highQuality.length > 0) return highQuality;

                return list.filter(v => {
                    const name = v.name.toLowerCase();
                    return !(name.includes('local') || 
                             name.includes('espeak') || 
                             name.includes('synth') || 
                             name.includes('robotic') || 
                             name.includes('soundfont'));
                });
            };

            const naturalFemale = filterRobotic(femaleVoices);
            const naturalMale = filterRobotic(maleVoices);

            let selectedVoicePool = isFemale 
                ? (naturalFemale.length > 0 ? naturalFemale : (femaleVoices.length > 0 ? femaleVoices : langVoices))
                : (naturalMale.length > 0 ? naturalMale : (maleVoices.length > 0 ? maleVoices : langVoices));

            if (selectedVoicePool.length === 0) {
                selectedVoicePool = langVoices.length > 0 ? langVoices : voicesList;
            }

            // Select distinct voice based on role name hash to maintain personality across cycles
            const hash = role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const voice = selectedVoicePool[hash % selectedVoicePool.length];

            if (voice) {
                utterance.voice = voice;
                utterance.lang = voice.lang;
            }

            // Configure natural pitch and rate adjustments
            utterance.pitch = config.pitch;
            utterance.rate = config.rate;

            // Prevent lockups
            const timeoutId = setTimeout(() => {
                resolve();
            }, 15000);

            utterance.onend = () => {
                clearTimeout(timeoutId);
                this.activeUtterance = null;
                resolve();
            };

            utterance.onerror = (e) => {
                console.warn("Speech synthesis error occurred:", e);
                clearTimeout(timeoutId);
                this.activeUtterance = null;
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        });
    }
}
