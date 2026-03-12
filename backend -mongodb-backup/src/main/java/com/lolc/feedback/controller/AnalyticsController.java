package com.lolc.feedback.controller;

import com.lolc.feedback.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    // Summary — always global, no branch filter
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        return ResponseEntity.ok(analyticsService.getSummary());
    }

    // Trends — supports fromMonth, toMonth (YYYY-MM), and optional branchId
    // Example: /api/analytics/trends?fromMonth=2026-01&toMonth=2026-06&branchId=abc123
    @GetMapping("/trends")
    public ResponseEntity<List<Map<String, Object>>> getTrends(
            @RequestParam(required = false) String fromMonth,
            @RequestParam(required = false) String toMonth,
            @RequestParam(required = false) String branchId) {
        return ResponseEntity.ok(analyticsService.getTrends(fromMonth, toMonth, branchId));
    }

    // Rating distribution — optional branchId filter
    // Example: /api/analytics/rating-distribution?branchId=abc123
    @GetMapping("/rating-distribution")
    public ResponseEntity<List<Map<String, Object>>> getRatingDistribution(
            @RequestParam(required = false) String branchId) {
        return ResponseEntity.ok(analyticsService.getRatingDistribution(branchId));
    }

    // Branch performance — always all branches (sorted by rating)
    @GetMapping("/branch-performance")
    public ResponseEntity<List<Map<String, Object>>> getBranchPerformance() {
        return ResponseEntity.ok(analyticsService.getBranchPerformance());
    }

    // Service distribution — optional branchId filter
    // Example: /api/analytics/service-distribution?branchId=abc123
    @GetMapping("/service-distribution")
    public ResponseEntity<List<Map<String, Object>>> getServiceDistribution(
            @RequestParam(required = false) String branchId) {
        return ResponseEntity.ok(analyticsService.getServiceDistribution(branchId));
    }
}
