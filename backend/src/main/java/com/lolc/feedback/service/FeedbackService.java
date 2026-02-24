package com.lolc.feedback.service;

import com.lolc.feedback.dto.FeedbackRequestDto;
import com.lolc.feedback.dto.FeedbackResponseDto;
import com.lolc.feedback.model.Branch;
import com.lolc.feedback.model.FeedbackResponse;
import com.lolc.feedback.repository.BranchRepository;
import com.lolc.feedback.repository.FeedbackResponseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackResponseRepository feedbackRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    // ── Submit feedback ────────────────────────────────────────────────────────
    public FeedbackResponseDto submitFeedback(FeedbackRequestDto request, String ipAddress) {
        // Rate limiting
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentCount = feedbackRepository.countByIpAddressAndCreatedAtAfter(ipAddress, oneHourAgo);
        if (recentCount >= 20) {
            throw new RuntimeException("Rate limit exceeded. Please try again later.");
        }

        // Resolve branch name from DB
        String branchName = "Unknown Branch";
        if (request.getBranchId() != null && !request.getBranchId().isBlank()) {
            branchName = branchRepository.findById(request.getBranchId())
                    .map(Branch::getName)
                    .orElse("Unknown Branch");
        }

        int overall = (int) Math.round(
                (request.getCustomerService() + request.getBranchEnvironment() + request.getRecommendation()) / 3.0
        );

        FeedbackResponse feedback = FeedbackResponse.builder()
                .branchId(request.getBranchId())
                .branchName(branchName)
                .customerServiceRating(request.getCustomerService())
                .branchEnvironmentRating(request.getBranchEnvironment())
                .recommendationRating(request.getRecommendation())
                .overallRating(overall)
                .additionalComments(request.getAdditionalComments())
                .serviceType(request.getServiceType())
                .ipAddress(ipAddress)
                .language(request.getLanguage() != null ? request.getLanguage() : "en")
                .createdAt(LocalDateTime.now())
                .build();

        FeedbackResponse saved = feedbackRepository.save(feedback);
        return toDto(saved);
    }

    // ── Get all feedback with real filtering ───────────────────────────────────
    // Supports: branchId, serviceType, rating, search (in branchName or comments), page, size
    public Page<FeedbackResponseDto> getAllFeedback(
            String branchId,
            String serviceType,
            Integer rating,
            String search,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Build dynamic MongoDB query
        Query query = new Query();

        // Branch filter
        if (branchId != null && !branchId.isBlank()) {
            query.addCriteria(Criteria.where("branchId").is(branchId));
        }

        // Service type filter
        if (serviceType != null && !serviceType.isBlank()) {
            query.addCriteria(Criteria.where("serviceType").is(serviceType));
        }

        // Rating filter — matches overallRating exactly
        if (rating != null) {
            query.addCriteria(Criteria.where("overallRating").is(rating));
        }

        // Search — matches branchName or additionalComments (case-insensitive)
        if (search != null && !search.isBlank()) {
            Pattern searchPattern = Pattern.compile(Pattern.quote(search), Pattern.CASE_INSENSITIVE);
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("branchName").regex(searchPattern),
                    Criteria.where("additionalComments").regex(searchPattern),
                    Criteria.where("serviceType").regex(searchPattern)
            ));
        }

        // Count total matching documents
        long total = mongoTemplate.count(query, FeedbackResponse.class);

        // Apply pagination
        query.with(pageable);
        List<FeedbackResponse> results = mongoTemplate.find(query, FeedbackResponse.class);

        List<FeedbackResponseDto> dtos = results.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, total);
    }

    public FeedbackResponseDto getFeedbackById(String id) {
        return feedbackRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + id));
    }

    // ── Convert model → DTO ────────────────────────────────────────────────────
    private FeedbackResponseDto toDto(FeedbackResponse f) {
        return FeedbackResponseDto.builder()
                .id(f.getId())
                .date(f.getCreatedAt() != null ? f.getCreatedAt().format(DATE_FORMATTER) : "")
                .time(f.getCreatedAt() != null ? f.getCreatedAt().format(TIME_FORMATTER) : "")
                .customerService(f.getCustomerServiceRating())
                .branchEnvironment(f.getBranchEnvironmentRating())
                .recommendation(f.getRecommendationRating())
                .additionalComments(f.getAdditionalComments())
                .branch(f.getBranchName())
                .branchId(f.getBranchId())
                .serviceType(f.getServiceType())
                .overallRating(f.getOverallRating())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
