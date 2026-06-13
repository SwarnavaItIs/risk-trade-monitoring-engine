#include <bits/stdc++.h>
using namespace std;

struct Trade
{
    string traderId;
    string stockSymbol;
    string tradeType;
    long long timestampMs;
};

string escapeJson(const string &s)
{
    string out;

    for (char c : s)
    {
        if (c == '"')
            out += "\\\"";
        else if (c == '\\')
            out += "\\\\";
        else
            out += c;
    }

    return out;
}

void addRule(
    vector<string> &triggeredRules,
    vector<string> &reasons,
    vector<string> &ruleDetails,
    int &riskScore,
    const string &ruleCode,
    const string &ruleName,
    const string &severity,
    int riskWeight,
    const string &reason)
{
    riskScore += riskWeight;
    triggeredRules.push_back(ruleCode);
    reasons.push_back(reason);

    string detail = "{";
    detail += "\"ruleCode\":\"" + escapeJson(ruleCode) + "\",";
    detail += "\"ruleName\":\"" + escapeJson(ruleName) + "\",";
    detail += "\"severity\":\"" + escapeJson(severity) + "\",";
    detail += "\"riskWeight\":" + to_string(riskWeight) + ",";
    detail += "\"action\":\"ALERT\",";
    detail += "\"reason\":\"" + escapeJson(reason) + "\"";
    detail += "}";

    ruleDetails.push_back(detail);
}

int main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    Trade currentTrade;

    if (!(cin >> currentTrade.traderId >> currentTrade.stockSymbol >> currentTrade.tradeType >> currentTrade.timestampMs))
    {
        cout << "{\"ok\":false,\"error\":\"Invalid current trade input\"}";
        return 0;
    }

    int n;
    cin >> n;

    vector<Trade> recentTrades;

    for (int i = 0; i < n; i++)
    {
        Trade t;
        cin >> t.traderId >> t.stockSymbol >> t.tradeType >> t.timestampMs;
        recentTrades.push_back(t);
    }

    int maxTrades;
    int velocityWindowSeconds;
    int washWindowMinutes;
    int minSameSideTrades;
    int momentumWindowSeconds;

    cin >> maxTrades >> velocityWindowSeconds >> washWindowMinutes >> minSameSideTrades >> momentumWindowSeconds;

    vector<string> triggeredRules;
    vector<string> reasons;
    vector<string> ruleDetails;

    int riskScore = 0;

    // R6 High-Frequency Velocity
    {
        long long windowStart =
            currentTrade.timestampMs - 1LL * velocityWindowSeconds * 1000;

        int count = 0;

        for (const Trade &t : recentTrades)
        {
            if (
                t.traderId == currentTrade.traderId &&
                t.timestampMs >= windowStart &&
                t.timestampMs <= currentTrade.timestampMs)
            {
                count++;
            }
        }

        if (count >= maxTrades)
        {
            string reason =
                "Trader " + currentTrade.traderId +
                " made " + to_string(count) +
                " trades within " + to_string(velocityWindowSeconds) +
                " seconds using C++ risk engine";

            addRule(
                triggeredRules,
                reasons,
                ruleDetails,
                riskScore,
                "R6_HIGH_FREQUENCY_VELOCITY",
                "High-Frequency Velocity",
                "MEDIUM",
                30,
                reason);
        }
    }

    // R7 Wash Trade Detection
    {
        long long windowStart =
            currentTrade.timestampMs - 1LL * washWindowMinutes * 60 * 1000;

        string oppositeTradeType =
            currentTrade.tradeType == "BUY" ? "SELL" : "BUY";

        bool found = false;

        for (const Trade &t : recentTrades)
        {
            if (
                t.traderId == currentTrade.traderId &&
                t.stockSymbol == currentTrade.stockSymbol &&
                t.tradeType == oppositeTradeType &&
                t.timestampMs >= windowStart &&
                t.timestampMs <= currentTrade.timestampMs)
            {
                found = true;
                break;
            }
        }

        if (found)
        {
            string reason =
                "Possible wash trade: trader " + currentTrade.traderId +
                " performed " + currentTrade.tradeType +
                " and " + oppositeTradeType +
                " on " + currentTrade.stockSymbol +
                " within " + to_string(washWindowMinutes) +
                " minutes using C++ risk engine";

            addRule(
                triggeredRules,
                reasons,
                ruleDetails,
                riskScore,
                "R7_WASH_TRADE_DETECTION",
                "Wash Trade Detection",
                "HIGH",
                45,
                reason);
        }
    }

    // R8 Momentum Ignition
    {
        long long windowStart =
            currentTrade.timestampMs - 1LL * momentumWindowSeconds * 1000;

        int count = 0;

        for (const Trade &t : recentTrades)
        {
            if (
                t.traderId == currentTrade.traderId &&
                t.stockSymbol == currentTrade.stockSymbol &&
                t.tradeType == currentTrade.tradeType &&
                t.timestampMs >= windowStart &&
                t.timestampMs <= currentTrade.timestampMs)
            {
                count++;
            }
        }

        if (count >= minSameSideTrades)
        {
            string reason =
                "Momentum ignition pattern: " + to_string(count) +
                " same-side " + currentTrade.tradeType +
                " trades on " + currentTrade.stockSymbol +
                " within " + to_string(momentumWindowSeconds) +
                " seconds using C++ risk engine";

            addRule(
                triggeredRules,
                reasons,
                ruleDetails,
                riskScore,
                "R8_MOMENTUM_IGNITION",
                "Momentum Ignition",
                "HIGH",
                40,
                reason);
        }
    }

    riskScore = min(riskScore, 100);

    string severity = "LOW";

    if (riskScore >= 70)
    {
        severity = "HIGH";
    }
    else if (riskScore >= 30)
    {
        severity = "MEDIUM";
    }

    cout << "{";
    cout << "\"ok\":true,";
    cout << "\"isRisky\":" << (triggeredRules.empty() ? "false" : "true") << ",";
    cout << "\"riskScore\":" << riskScore << ",";
    cout << "\"severity\":\"" << severity << "\",";

    cout << "\"triggeredRules\":[";
    for (int i = 0; i < (int)triggeredRules.size(); i++)
    {
        if (i)
            cout << ",";
        cout << "\"" << escapeJson(triggeredRules[i]) << "\"";
    }
    cout << "],";

    cout << "\"reasons\":[";
    for (int i = 0; i < (int)reasons.size(); i++)
    {
        if (i)
            cout << ",";
        cout << "\"" << escapeJson(reasons[i]) << "\"";
    }
    cout << "],";

    cout << "\"ruleDetails\":[";
    for (int i = 0; i < (int)ruleDetails.size(); i++)
    {
        if (i)
            cout << ",";
        cout << ruleDetails[i];
    }
    cout << "]";

    cout << "}";

    return 0;
}