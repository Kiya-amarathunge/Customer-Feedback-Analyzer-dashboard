package com.lolc.feedback.controller;



import com.lolc.feedback.dto.FeedbackRequestDto;
import com.lolc.feedback.dto.FeedbackResponseDto;
import com.lolc.feedback.service.FeedbackService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    // ── Public: submit feedback ────────────────────────────────────────────────
    @PostMapping("/feedback")
    public ResponseEntity<?> submitFeedback(
            @Valid @RequestBody FeedbackRequestDto request,
            HttpServletRequest httpRequest) {
        try {
            String ipAddress = getClientIp(httpRequest);
            FeedbackResponseDto response = feedbackService.submitFeedback(request, ipAddress);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Feedback submitted successfully",
                    "feedbackId", response.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ── Admin: list responses with full filtering ──────────────────────────────
    // Supports: branch (branchId), serviceType, rating, search, page, size
    @GetMapping("/responses")
    public ResponseEntity<Page<FeedbackResponseDto>> getAllFeedback(
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                feedbackService.getAllFeedback(branch, serviceType, rating, search, page, size)
        );
    }

    // ── Admin: get single response ─────────────────────────────────────────────
    @GetMapping("/responses/{id}")
    public ResponseEntity<FeedbackResponseDto> getFeedbackById(@PathVariable String id) {
        return ResponseEntity.ok(feedbackService.getFeedbackById(id));
    }

    // ── Admin: export CSV ──────────────────────────────────────────────────────
    @GetMapping("/responses/export")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String search) {

        StringBuilder csv = new StringBuilder();
        csv.append("Date,Time,Customer Service,Branch Environment,Recommendation,Overall,Branch,Service,Comments\n");

        Page<FeedbackResponseDto> allPages = feedbackService.getAllFeedback(branch, serviceType, rating, search, 0, 100000);
        allPages.getContent().forEach(f -> csv.append(String.format("%s,%s,%d,%d,%d,%d,%s,%s,\"%s\"\n",
                f.getDate(), f.getTime(),
                f.getCustomerService(), f.getBranchEnvironment(),
                f.getRecommendation(), f.getOverallRating(),
                f.getBranch(),
                f.getServiceType() != null ? f.getServiceType() : "",
                f.getAdditionalComments() != null ? f.getAdditionalComments().replace("\"", "\"\"") : ""
        )));

        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"feedback_export.csv\"")
                .body(csv.toString());
    }

    // ── Helper ─────────────────────────────────────────────────────────────────
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
