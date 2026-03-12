package com.lolc.feedback.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class NotifyLkService {

    @Value("${notify.lk.user-id:}")
    private String userId;

    @Value("${notify.lk.api-key:}")
    private String apiKey;

    @Value("${notify.lk.sender-id:LOLC}")
    private String senderId;

    @Value("${app.feedback.base-url:http://localhost:3000}")
    private String feedbackBaseUrl;

    /**
     * Sends an SMS via Notify.lk
     * Returns null on success, or an error message string on failure
     */
    public String sendSms(String mobileNumber, String message) {
        // If API credentials not configured, simulate success (dev mode)
        if (userId == null || userId.isBlank() || apiKey == null || apiKey.isBlank()) {
            System.out.println("⚠️  Notify.lk not configured — SMS simulated to: " + mobileNumber);
            System.out.println("📱 Message: " + message);
            return null; // null = success
        }

        try {
            String urlStr = "https://app.notify.lk/api/v1/send";

            // Format mobile: remove leading 0 and add 94 country code
            String formatted = formatMobile(mobileNumber);

            String params = "user_id=" + URLEncoder.encode(userId, StandardCharsets.UTF_8)
                    + "&api_key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                    + "&service_id=" + URLEncoder.encode(senderId, StandardCharsets.UTF_8)
                    + "&to=" + URLEncoder.encode(formatted, StandardCharsets.UTF_8)
                    + "&message=" + URLEncoder.encode(message, StandardCharsets.UTF_8);

            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(params.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(responseCode == 200
                            ? conn.getInputStream() : conn.getErrorStream()));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) response.append(line);
            reader.close();

            String responseBody = response.toString();

            // Notify.lk returns {"status":"success",...} on success
            if (responseCode == 200 && responseBody.contains("\"success\"")) {
                return null; // success
            } else {
                return "SMS failed: " + responseBody;
            }

        } catch (Exception e) {
            return "SMS error: " + e.getMessage();
        }
    }

    public String buildFeedbackMessage(String token) {
        String link = feedbackBaseUrl + "/feedback?ref=" + token;
        return "Dear Customer, LOLC invites you to share your feedback. "
                + "Please click the link below:\n" + link
                + "\nThank you for choosing LOLC Finance.";
    }

    private String formatMobile(String mobile) {
        // Remove spaces, dashes
        mobile = mobile.replaceAll("[\\s\\-]", "");
        // If starts with 0, replace with 94
        if (mobile.startsWith("0")) return "94" + mobile.substring(1);
        // If already has 94, keep as is
        if (mobile.startsWith("94")) return mobile;
        // Otherwise prepend 94
        return "94" + mobile;
    }
}
