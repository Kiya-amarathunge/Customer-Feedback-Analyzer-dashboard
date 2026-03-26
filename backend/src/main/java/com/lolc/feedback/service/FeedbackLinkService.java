package com.lolc.feedback.service;

import com.lolc.feedback.dto.*;
import com.lolc.feedback.model.Employee;
import com.lolc.feedback.model.FeedbackLink;
import com.lolc.feedback.repository.EmployeeRepository;
import com.lolc.feedback.repository.FeedbackLinkRepository;
import com.lolc.feedback.repository.FeedbackResponseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FeedbackLinkService {

    @Autowired private FeedbackLinkRepository linkRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private FeedbackResponseRepository feedbackRepository;
    @Autowired private NotifyLkService smsService;

    @Value("${app.feedback.base-url:http://localhost:3000}")
    private String feedbackBaseUrl;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // Reference ID prefix constant — all loan references must use this format
    public static final String REFERENCE_PREFIX = "LOLC-REF-LOAN-APP-";

    // ── Admin: send single link (no referenceId — manual send) ────────────────
    public FeedbackLinkDto sendLink(SendLinkDto request) {
        Employee employee = employeeRepository.findByEmployeeNumber(request.getEmployeeNumber())
                .orElseThrow(() -> new RuntimeException("Employee not found: " + request.getEmployeeNumber()));

        FeedbackLink link = createAndSend(
                employee, request.getCustomerMobile(), null, null
        );
        return toDto(link);
    }

    // ── External API: send link with customerId + referenceId ─────────────────
    public FeedbackLinkDto sendLinkExternal(ExternalSendLinkDto request) {
        Employee employee = employeeRepository.findByEmployeeNumber(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found: " + request.getEmployeeId()));

        // Validate referenceId prefix format if provided
        String referenceId = request.getReferenceId();
        if (referenceId != null && !referenceId.isBlank()) {
            if (!referenceId.startsWith(REFERENCE_PREFIX)) {
                throw new RuntimeException(
                        "Invalid referenceId format. Must start with: " + REFERENCE_PREFIX +
                                " (e.g. LOLC-REF-LOAN-APP-12345)"
                );
            }
        }

        FeedbackLink link = createAndSend(
                employee, request.getCustomerMobile(), request.getCustomerId(), referenceId
        );
        return toDto(link);
    }

    // ── Core: create record + send SMS ────────────────────────────────────────
    private FeedbackLink createAndSend(Employee employee, String customerMobile,
                                       String customerId, String referenceId) {
        // Generate unique token
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 24).toUpperCase();

        FeedbackLink link = FeedbackLink.builder()
                .token(token)
                .employeeId(employee.getId())
                .employeeNumber(employee.getEmployeeNumber())
                .employeeName(employee.getFullName())
                .customerMobile(customerMobile)
                .customerId(customerId)
                .branchName(employee.getBranchName())
                .referenceId(referenceId)   // e.g. LOLC-REF-LOAN-APP-12345 or null
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        link = linkRepository.save(link);

        // Send SMS
        String message = smsService.buildFeedbackMessage(token);
        String error = smsService.sendSms(customerMobile, message);

        if (error == null) {
            link.setStatus("SENT");
            link.setSentAt(LocalDateTime.now());
        } else {
            link.setStatus("FAILED");
            link.setSmsError(error);
        }

        return linkRepository.save(link);
    }

    // ── Mark as OPENED (called when customer clicks link) ─────────────────────
    public void markOpened(String token) {
        linkRepository.findByToken(token).ifPresent(link -> {
            if ("SENT".equals(link.getStatus())) {
                link.setStatus("OPENED");
                link.setOpenedAt(LocalDateTime.now());
                linkRepository.save(link);
            }
        });
    }

    // ── Mark as COMPLETED (called when customer submits feedback) ─────────────
    public void markCompleted(String token, Long feedbackResponseId) {
        linkRepository.findByToken(token).ifPresent(link -> {
            link.setStatus("COMPLETED");
            link.setCompletedAt(LocalDateTime.now());
            if (feedbackResponseId != null) link.setFeedbackResponseId(feedbackResponseId);
            linkRepository.save(link);
        });
    }

    // ── Get employee ref from token (used by feedback form on submit) ──────────
    public String getEmployeeNumberByToken(String token) {
        return linkRepository.findByToken(token)
                .map(FeedbackLink::getEmployeeNumber)
                .orElse(null);
    }

    // ── Admin: get all links with optional filters ─────────────────────────────
    public List<FeedbackLinkDto> getAllLinks(String status, String employeeNumber) {
        List<FeedbackLink> links;

        if (employeeNumber != null && !employeeNumber.isBlank()) {
            links = linkRepository.findByEmployeeNumberOrderByCreatedAtDesc(employeeNumber);
        } else if (status != null && !status.isBlank()) {
            links = linkRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            links = linkRepository.findAllByOrderByCreatedAtDesc();
        }

        // Apply status filter on top of employee filter
        if (employeeNumber != null && !employeeNumber.isBlank()
                && status != null && !status.isBlank()) {
            links = links.stream()
                    .filter(l -> status.equals(l.getStatus()))
                    .collect(Collectors.toList());
        }

        return links.stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── Admin: summary stats ──────────────────────────────────────────────────
    public LinkSummaryDto getSummary() {
        long sent      = linkRepository.countByStatus("SENT");
        long opened    = linkRepository.countByStatus("OPENED");
        long completed = linkRepository.countByStatus("COMPLETED");
        long failed    = linkRepository.countByStatus("FAILED");
        long pending   = linkRepository.countByStatus("PENDING");
        long totalSent = sent + opened + completed;

        double openRate       = totalSent > 0 ? Math.round((double)(opened + completed) / totalSent * 1000) / 10.0 : 0;
        double completionRate = (opened + completed) > 0 ? Math.round((double) completed / (opened + completed) * 1000) / 10.0 : 0;

        return LinkSummaryDto.builder()
                .totalSent(totalSent)
                .opened(opened + completed)
                .completed(completed)
                .failed(failed)
                .pending(pending)
                .openRate(openRate)
                .completionRate(completionRate)
                .build();
    }

    // ── Employee management ───────────────────────────────────────────────────
    public Employee addEmployee(AddEmployeeDto request) {
        if (employeeRepository.existsByEmployeeNumber(request.getEmployeeNumber()))
            throw new RuntimeException("Employee number already exists");

        return employeeRepository.save(Employee.builder()
                .employeeNumber(request.getEmployeeNumber())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .branchId(request.getBranchId())
                .branchName(request.getBranchName())
                .active(true)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findByActiveTrue();
    }

    // ── Employee performance ──────────────────────────────────────────────────
    public List<Map<String, Object>> getEmployeePerformance() {
        List<Employee> employees = employeeRepository.findByActiveTrue();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Employee emp : employees) {
            List<FeedbackLink> completed = linkRepository
                    .findByEmployeeNumberOrderByCreatedAtDesc(emp.getEmployeeNumber())
                    .stream()
                    .filter(l -> "COMPLETED".equals(l.getStatus()) && l.getFeedbackResponseId() != null)
                    .collect(Collectors.toList());

            long totalSent      = linkRepository.countByEmployeeId(emp.getId());
            long totalCompleted = completed.size();

            double avgRating = completed.stream()
                    .map(l -> feedbackRepository.findById(l.getFeedbackResponseId()).orElse(null))
                    .filter(Objects::nonNull)
                    .mapToInt(f -> f.getOverallRating())
                    .average()
                    .orElse(0.0);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("employeeNumber", emp.getEmployeeNumber());
            row.put("employeeName",   emp.getFullName());
            row.put("branchName",     emp.getBranchName());
            row.put("totalSent",      totalSent);
            row.put("totalCompleted", totalCompleted);
            row.put("averageRating",  Math.round(avgRating * 100.0) / 100.0);
            row.put("completionRate", totalSent > 0
                    ? Math.round((double) totalCompleted / totalSent * 1000) / 10.0 : 0);
            result.add(row);
        }

        result.sort((a, b) -> Double.compare(
                (double) b.get("averageRating"), (double) a.get("averageRating")));

        return result;
    }

    // ── Helper: map entity to DTO ─────────────────────────────────────────────
    private FeedbackLinkDto toDto(FeedbackLink l) {
        return FeedbackLinkDto.builder()
                .id(l.getId())
                .token(l.getToken())
                .employeeNumber(l.getEmployeeNumber())
                .employeeName(l.getEmployeeName())
                .branchName(l.getBranchName())
                .customerMobile(l.getCustomerMobile())
                .customerId(l.getCustomerId())
                .referenceId(l.getReferenceId())
                .status(l.getStatus())
                .smsError(l.getSmsError())
                .createdAt(l.getCreatedAt() != null ? l.getCreatedAt().format(FMT) : null)
                .sentAt(l.getSentAt() != null ? l.getSentAt().format(FMT) : null)
                .openedAt(l.getOpenedAt() != null ? l.getOpenedAt().format(FMT) : null)
                .completedAt(l.getCompletedAt() != null ? l.getCompletedAt().format(FMT) : null)
                .feedbackLink(feedbackBaseUrl + "/feedback?ref=" + l.getToken())
                .build();
    }
}
