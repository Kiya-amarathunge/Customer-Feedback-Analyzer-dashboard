package com.lolc.feedback.controller;

import com.lolc.feedback.dto.*;
import com.lolc.feedback.model.Employee;
import com.lolc.feedback.service.FeedbackLinkService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FeedbackLinkController {

    @Autowired
    private FeedbackLinkService linkService;

    // ── Admin: send single link ────────────────────────────────────────────────
    @PostMapping("/admin/send-link")
    public ResponseEntity<?> sendLink(@Valid @RequestBody SendLinkDto request) {
        try {
            FeedbackLinkDto result = linkService.sendLink(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "SENT".equals(result.getStatus())
                            ? "Link sent successfully" : "Failed to send link",
                    "link", result
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── Admin: get all sent links with optional filters ────────────────────────
    @GetMapping("/admin/feedback-links")
    public ResponseEntity<List<FeedbackLinkDto>> getAllLinks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String employeeNumber) {
        return ResponseEntity.ok(linkService.getAllLinks(status, employeeNumber));
    }

    // ── Admin: summary stats ───────────────────────────────────────────────────
    @GetMapping("/admin/feedback-links/summary")
    public ResponseEntity<LinkSummaryDto> getSummary() {
        return ResponseEntity.ok(linkService.getSummary());
    }

    // ── Admin: employee performance ────────────────────────────────────────────
    @GetMapping("/admin/employee-performance")
    public ResponseEntity<List<Map<String, Object>>> getEmployeePerformance() {
        return ResponseEntity.ok(linkService.getEmployeePerformance());
    }

    // ── Admin: add employee manually ───────────────────────────────────────────
    @PostMapping("/admin/employees")
    public ResponseEntity<?> addEmployee(@Valid @RequestBody AddEmployeeDto request) {
        try {
            Employee emp = linkService.addEmployee(request);
            return ResponseEntity.ok(Map.of("success", true, "employee", emp));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── Admin: get all employees ───────────────────────────────────────────────
    @GetMapping("/admin/employees")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(linkService.getAllEmployees());
    }

    // ── Tracking: mark link as opened (called by feedback form on load) ────────
    @PostMapping("/links/{token}/opened")
    public ResponseEntity<?> markOpened(@PathVariable String token) {
        linkService.markOpened(token);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Tracking: mark link as completed (called by feedback form on submit) ───
    @PostMapping("/links/{token}/completed")
    public ResponseEntity<?> markCompleted(
            @PathVariable String token,
            @RequestBody(required = false) Map<String, Object> body) {
        Long feedbackId = null;
        if (body != null && body.containsKey("feedbackResponseId")) {
            feedbackId = Long.parseLong(body.get("feedbackResponseId").toString());
        }
        linkService.markCompleted(token, feedbackId);
        return ResponseEntity.ok(Map.of("success", true));
    }
}

