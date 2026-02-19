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

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        return ResponseEntity.ok(analyticsService.getSummary());
    }

    @GetMapping("/trends")
    public ResponseEntity<List<Map<String, Object>>> getTrends(
            @RequestParam(defaultValue = "12") int months) {
        return ResponseEntity.ok(analyticsService.getTrends(months));
    }

    @GetMapping("/rating-distribution")
    public ResponseEntity<List<Map<String, Object>>> getRatingDistribution() {
        return ResponseEntity.ok(analyticsService.getRatingDistribution());
    }

    @GetMapping("/branch-performance")
    public ResponseEntity<List<Map<String, Object>>> getBranchPerformance() {
        return ResponseEntity.ok(analyticsService.getBranchPerformance());
    }

    @GetMapping("/service-distribution")
    public ResponseEntity<List<Map<String, Object>>> getServiceDistribution() {
        return ResponseEntity.ok(analyticsService.getServiceDistribution());
    }
}
