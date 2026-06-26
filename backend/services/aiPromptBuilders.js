const getComplianceSystemPrompt = () => {
    return `
You are a trade surveillance and compliance assistant.

Your job is to explain trading-risk alerts, summarize investigations, and help analysts understand risk evidence.

Rules:
- Use only the data provided by the backend.
- Do not invent facts.
- Do not accuse a trader of fraud or manipulation.
- Use cautious language such as "may indicate", "could suggest", or "requires review".
- Do not provide legal advice.
- Keep the explanation clear, structured, and useful for a risk analyst.
- Return valid Markdown only.
- Use proper Markdown headings, bullet points, numbered lists, and bold labels.
- Do not wrap the response in code fences.
- Do not include raw JSON in the final answer unless specifically needed.
`;
};

const buildTestPrompt = () => {
    return `
Generate a short confirmation message saying that the AI compliance assistant is ready for the Risk Trade Monitoring Engine.
Mention that it can help explain alerts, summarize investigations, and generate risk reports.
Return valid Markdown only.
`;
};

const buildAlertExplanationPrompt = ({ alert, trade }) => {
    return `
Explain the following trade surveillance alert for a risk analyst.

Use only the data provided below. Do not invent facts.
Do not accuse the trader of fraud or manipulation.
Use cautious language such as "may indicate", "could suggest", or "requires review".

Formatting instructions:
- Return valid Markdown only.
- Use proper Markdown headings, bullet points, numbered lists, and bold labels.
- Do not wrap the response in code fences.
- Do not include raw JSON in the final answer unless specifically needed.

Return the explanation using exactly these Markdown headings:

## 1. What Happened
## 2. Why This Alert Was Triggered
## 3. Risk Interpretation
## 4. Suggested Analyst Checks
## 5. Recommended Next Action

Alert Data:
${JSON.stringify(alert, null, 2)}

Related Trade Data:
${JSON.stringify(trade || "No related trade data found", null, 2)}
`;
};

const buildInvestigationSummaryPrompt = ({ alert, trade }) => {
    return `
Generate an investigation summary for the following trade surveillance alert.

Use only the data provided below.
Do not invent missing facts.
Do not accuse the trader of fraud, manipulation, or illegal activity.
Use cautious language such as "may indicate", "could suggest", "requires review", or "should be investigated further".

Formatting instructions:
- Return valid Markdown only.
- Use proper Markdown headings, bullet points, numbered lists, and bold labels.
- Do not wrap the response in code fences.
- Do not include raw JSON in the final answer unless specifically needed.

Return the response using exactly these Markdown headings:

## 1. Investigation Overview
## 2. Alert Evidence
## 3. Rule-Based Risk Reasoning
## 4. Analyst Review Status
## 5. Comment History Summary
## 6. Recommended Next Steps
## 7. Final Review Note

Important:
- If no comments exist, clearly say that no analyst comments are available yet.
- If assignment information is missing, say that the alert is not assigned or assignment data is unavailable.
- Keep the summary professional and suitable for a compliance/risk review workflow.

Alert Data:
${JSON.stringify(alert, null, 2)}

Related Trade Data:
${JSON.stringify(trade || "No related trade data found", null, 2)}
`;
};

const toPlainObject = (value) => {
    if (!value) {
        return {};
    }

    if (typeof value.toObject === "function") {
        return value.toObject();
    }

    return value;
};

const formatList = (items, emptyText) => {
    if (!Array.isArray(items) || items.length === 0) {
        return emptyText;
    }

    return items.map((item) => `- ${item}`).join("\n");
};

const formatCommentHistory = (comments) => {
    if (!Array.isArray(comments) || comments.length === 0) {
        return "No analyst comments are available yet.";
    }

    return comments
        .map((entry) => {
            const author = entry.commentedBy || "Unknown analyst";
            const role = entry.commentedByRole || "Unknown role";
            const createdAt = entry.createdAt
                ? new Date(entry.createdAt).toLocaleString()
                : "time unavailable";

            return `- ${author} (${role}) at ${createdAt}: ${entry.comment}`;
        })
        .join("\n");
};

const formatTradeSnapshot = (tradeData) => {
    if (!tradeData || Object.keys(tradeData).length === 0) {
        return "No related trade data found.";
    }

    return [
        `- **Trade Type:** ${tradeData.tradeType || "Not available"}`,
        `- **Quantity:** ${tradeData.quantity ?? "Not available"}`,
        `- **Price:** ${tradeData.price ?? "Not available"}`,
        `- **Trade Value:** ${tradeData.tradeValue ?? "Not available"}`,
        `- **Trade Time:** ${tradeData.tradeTime || "Not available"}`
    ].join("\n");
};

const buildLocalAlertExplanation = ({ alert, trade, providerMessage }) => {
    const alertData = toPlainObject(alert);
    const tradeData = toPlainObject(trade);
    const priority = alertData.priority || alertData.severity || "MEDIUM";

    return `
## 1. What Happened
An alert of type **${alertData.alertType || "UNKNOWN"}** was generated for trader **${alertData.traderId || "unknown"}** on **${alertData.stockSymbol || "unknown symbol"}**. The alert currently has severity **${alertData.severity || "UNKNOWN"}**, priority **${priority}**, status **${alertData.status || "UNKNOWN"}**, and risk score **${alertData.riskScore ?? "not available"}**.

## 2. Why This Alert Was Triggered
**Triggered rules:**
${formatList(alertData.triggeredRules, "No triggered rules were recorded.")}

**Recorded reasons:**
${formatList(alertData.reasons, "No rule reasons were recorded.")}

## 3. Risk Interpretation
This activity may indicate behavior that requires analyst review. The system generated this local explanation because the external AI provider was unavailable, so the interpretation is based only on stored alert and trade fields.

## 4. Suggested Analyst Checks
- Review the triggered rule evidence and compare it with the trader's normal activity.
- Confirm whether the alert is assigned to the right analyst and whether the priority is appropriate.
- Check any related trade details such as side, quantity, price, notional value, and trade time.
- Add investigation comments documenting the analyst review.

## 5. Recommended Next Action
Continue the normal alert review workflow: assign ownership if needed, add comments, and update the alert status once the investigation has enough evidence.

**Provider Note:** ${providerMessage || "External AI provider unavailable."}

**Related Trade Snapshot:**
${formatTradeSnapshot(tradeData)}
`.trim();
};

const buildLocalInvestigationSummary = ({ alert, trade, providerMessage }) => {
    const alertData = toPlainObject(alert);
    const tradeData = toPlainObject(trade);
    const priority = alertData.priority || alertData.severity || "MEDIUM";

    return `
## 1. Investigation Overview
Alert **${alertData.alertType || "UNKNOWN"}** is under review for trader **${alertData.traderId || "unknown"}** and symbol **${alertData.stockSymbol || "unknown"}**. Current status is **${alertData.status || "UNKNOWN"}**; severity is **${alertData.severity || "UNKNOWN"}**; priority is **${priority}**.

## 2. Alert Evidence
**Triggered rules:**
${formatList(alertData.triggeredRules, "No triggered rules were recorded.")}

**Reasons:**
${formatList(alertData.reasons, "No rule reasons were recorded.")}

## 3. Rule-Based Risk Reasoning
The available rule output may suggest unusual or policy-relevant trading behavior, but it does not by itself prove intent or misconduct. Analyst review is required before drawing conclusions.

## 4. Analyst Review Status
- **Assigned to:** ${alertData.assignedToName || "Unassigned"}
- **Review deadline:** ${alertData.reviewDeadline ? new Date(alertData.reviewDeadline).toLocaleString() : "No deadline set"}
- **Reviewed by:** ${alertData.reviewedBy || "Not reviewed yet"}
- **Latest review comment:** ${alertData.reviewComment || "No review comment recorded"}

## 5. Comment History Summary
${formatCommentHistory(alertData.commentHistory)}

## 6. Recommended Next Steps
- Validate the rule evidence against the related trade/order record.
- Review trader history and recent alerts for repeated patterns.
- Document findings in the comment history.
- Escalate or resolve the alert according to internal policy.

## 7. Final Review Note
This summary was generated locally because the external AI provider was unavailable. Treat it as a structured operational summary, not as a final compliance conclusion.

**Provider Note:** ${providerMessage || "External AI provider unavailable."}

**Related Trade Snapshot:**
${formatTradeSnapshot(tradeData)}
`.trim();
};

const buildDailyRiskReportPrompt = ({ reportDate, reportData }) => {
    return `
Generate a professional Daily Risk Monitoring Report for the Risk Trade Monitoring Engine.

Use only the data provided below.
Do not invent numbers, rules, traders, symbols, or events.
Do not accuse any trader of fraud or illegal activity.
Use cautious compliance language such as "may indicate", "could suggest", "requires review", or "should be investigated further".

Formatting instructions:
- Return valid Markdown only.
- Use proper Markdown headings, bullet points, numbered lists, and bold labels.
- Do not wrap the response in code fences.
- Do not include raw JSON in the final answer unless specifically needed.

Return the report using exactly these Markdown headings:

# Daily Risk Monitoring Report
## 1. Executive Summary
## 2. Key Metrics
## 3. Top Triggered Risk Rules
## 4. Blocked Trade Analysis
## 5. High-Risk Traders and Symbols
## 6. Notable Alerts
## 7. Recommended Follow-Up Actions
## 8. Final Compliance Note

Report Date:
${reportDate}

Report Data:
${JSON.stringify(reportData, null, 2)}
`;
};

const buildRiskAssistantPrompt = ({ question, intent, data }) => {
    return `
You are a trade surveillance risk assistant for the Risk Trade Monitoring Engine.

Answer the analyst's question using only the data provided below.

Rules:
- Do not invent traders, symbols, alerts, rules, or numbers.
- Do not accuse any trader of fraud, manipulation, or illegal activity.
- Use cautious language such as "may indicate", "could suggest", "requires review", or "should be reviewed further".
- If the provided data is empty, clearly say that no matching data was found.
- Keep the answer practical and useful for a risk analyst.

Return valid Markdown only.
Use proper Markdown headings, bullet points, numbered lists, and bold labels.
Do not wrap the response in code fences.

Analyst Question:
${question}

Detected Intent:
${intent}

Relevant Data:
${JSON.stringify(data, null, 2)}
`;
};

const buildRuleTuningSuggestionPrompt = ({ data }) => {
    return `
You are a trade surveillance risk configuration assistant.

Your task is to review the current risk rule activity and suggest possible rule-tuning improvements for an admin.

Use only the data provided below.
Do not invent rule codes, trigger counts, traders, symbols, or thresholds.
Do not directly recommend disabling important controls unless the data strongly supports reviewing them.
Do not make automatic changes.
Do not accuse traders of fraud or manipulation.

Use cautious language such as:
- "consider reviewing"
- "may indicate"
- "could suggest"
- "requires further analyst review"
- "admin should validate before changing"

Return valid Markdown only.
Use proper Markdown headings, bullet points, numbered lists, and bold labels.
Do not wrap the response in code fences.

Return the response in this structure:

# AI Rule Tuning Suggestions

## 1. Executive Summary
Briefly summarize overall rule activity.

## 2. Rules Triggering Frequently
Identify rules with high trigger/block counts and explain what this may indicate.

## 3. Possible Threshold Review
Suggest which rule thresholds may need review, but do not invent exact new values unless the data clearly supports it.

## 4. False Positive Risk
Mention rules that may be generating too many alerts or blocks and should be manually reviewed.

## 5. Rules With Low Activity
Mention rules that have low or no activity and may need testing, calibration, or more data.

## 6. Recommended Admin Actions
Give practical next steps for the admin.

## 7. Final Caution
Clearly state that AI suggestions are advisory only and rule changes should be validated by an admin.

Rule Activity Data:
${JSON.stringify(data, null, 2)}
`;
};

module.exports = {
    getComplianceSystemPrompt,
    buildTestPrompt,
    buildAlertExplanationPrompt,
    buildInvestigationSummaryPrompt,
    buildLocalAlertExplanation,
    buildLocalInvestigationSummary,
    buildDailyRiskReportPrompt,
    buildRiskAssistantPrompt,
    buildRuleTuningSuggestionPrompt
};
