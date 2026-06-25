const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

const getAIModelName = () => {
    return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
};

const getAIServiceStatus = () => {
    return {
        provider: process.env.AI_PROVIDER || "GEMINI",
        model: getAIModelName(),
        configured: Boolean(process.env.GEMINI_API_KEY),
        apiKeyEnv: "GEMINI_API_KEY"
    };
};

const sanitizeAIError = (error) => {
    const message = typeof error === "string"
        ? error
        : error?.message || "";

    if (!message) {
        return "Gemini is currently unavailable. Check backend logs for details.";
    }

    if (/api key not configured|missing api key/i.test(message)) {
        return "Gemini API key is not configured. Add GEMINI_API_KEY to the backend environment.";
    }

    if (/fetch failed|network|enotfound|econn|etimedout|socket|tls/i.test(message)) {
        return "Gemini could not be reached from the backend. Check internet access, firewall/proxy settings, and GEMINI_API_KEY.";
    }

    if (/api key|permission|unauthorized|forbidden|401|403/i.test(message)) {
        return "Gemini rejected the request. Check GEMINI_API_KEY and API permissions.";
    }

    if (/model|not found|404/i.test(message)) {
        return `Gemini model "${getAIModelName()}" is unavailable. Check GEMINI_MODEL.`;
    }

    return "Gemini returned an error. Check backend logs for details.";
};

const callAIModel = async ({
    systemPrompt,
    userPrompt,
    temperature = 0.2
}) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return {
                success: false,
                content: sanitizeAIError("Gemini API key not configured")
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: getAIModelName()
        });

        const prompt = `
SYSTEM:
${systemPrompt}

USER:
${userPrompt}
`;

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature
            }
        });

        const text = result.response.text();

        return {
            success: true,
            content: text
        };
    }
    catch (error) {
        console.error("Gemini error:", error);

        return {
            success: false,
            content: sanitizeAIError(error),
            rawError: error.message
        };
    }
};

module.exports = {
    callAIModel,
    getAIServiceStatus,
    sanitizeAIError
};
