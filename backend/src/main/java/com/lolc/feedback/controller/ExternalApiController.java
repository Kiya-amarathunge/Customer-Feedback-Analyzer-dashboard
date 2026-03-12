package com.lolc.feedback.controller;

import com.lolc.feedback.dto.ExternalSendLinkDto;
import com.lolc.feedback.dto.FeedbackLinkDto;
import com.lolc.feedback.service.FeedbackLinkService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/external")
public class ExternalApiController {

    @Autowired
    private FeedbackLinkService linkService;

    @Value("${app.external.api-key:LOLC-EXTERNAL-KEY-2026}")
    private String validApiKey;

    /**
     * External API endpoint for other LOLC systems to trigger feedback SMS.
     *
     * POST /api/external/send-feedback-link
     * Header: X-API-Key: <your-api-key>
     * Body: { "customerId": "CUST001", "employeeId": "EMP001", "customerMobile": "07XXXXXXXX" }
     */
    @PostMapping("/send-feedback-link")
    public ResponseEntity<?> sendFeedbackLink(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @Valid @RequestBody ExternalSendLinkDto request) {

        // Validate API key
        if (apiKey == null || !apiKey.equals(validApiKey)) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Unauthorized: Invalid or missing API key"
            ));
        }

        try {
            FeedbackLinkDto result = linkService.sendLinkExternal(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "status",  result.getStatus(),
                    "message", "SENT".equals(result.getStatus())
                            ? "Feedback link sent successfully"
                            : "Failed to send feedback link: " + result.getSmsError(),
                    "token",   result.getToken(),
                    "link",    result.getFeedbackLink()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}

