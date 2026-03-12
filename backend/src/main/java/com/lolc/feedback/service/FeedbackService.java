package com.lolc.feedback.service;

import com.lolc.feedback.dto.FeedbackRequestDto;
import com.lolc.feedback.dto.FeedbackResponseDto;
import com.lolc.feedback.model.Branch;
import com.lolc.feedback.model.FeedbackResponse;
import com.lolc.feedback.repository.BranchRepository;
import com.lolc.feedback.repository.FeedbackResponseRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackResponseRepository feedbackRepository;

    @Autowired
    private BranchRepository branchRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ── Submit feedback ────────────────────────────────────────────────────────
    public FeedbackResponseDto submitFeedback(FeedbackRequestDto request, String ipAddress) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentCount = feedbackRepository.countByIpAddressAndCreatedAtAfter(ipAddress, oneHourAgo);
        if (recentCount >= 20) {
            throw new RuntimeException("Rate limit exceeded. Please try again later.");
        }

        String branchName = "Unknown Branch";
        Long branchId = null;
        if (request.getBranchId() != null && !request.getBranchId().isBlank()) {
            try {
                branchId = Long.parseLong(request.getBranchId());
                Long finalBranchId = branchId;
                branchName = branchRepository.findById(branchId)
                        .map(Branch::getName)
                        .orElse("Unknown Branch");
            } catch (NumberFormatException e) {
                // branchId was a typed custom name, not a numeric ID
                branchName = request.getBranchId();
                branchId = null;
            }
        } else if (request.getBranchName() != null && !request.getBranchName().isBlank()) {
            branchName = request.getBranchName();
        }

        int overall = (int) Math.round(
                (request.getCustomerService() + request.getBranchEnvironment() + request.getRecommendation()) / 3.0
        );

        FeedbackResponse feedback = FeedbackResponse.builder()
                .branchId(branchId)
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

        return toDto(feedbackRepository.save(feedback));
    }

    // ── Get all feedback with filtering using JPA Criteria API ─────────────────
    public Page<FeedbackResponseDto> getAllFeedback(
            String branchId, String serviceType, Integer rating, String search, int page, int size) {

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // ── Count query ──
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<FeedbackResponse> countRoot = countQuery.from(FeedbackResponse.class);
        countQuery.select(cb.count(countRoot));
        countQuery.where(buildPredicates(cb, countRoot, branchId, serviceType, rating, search));
        long total = entityManager.createQuery(countQuery).getSingleResult();

        // ── Data query ──
        CriteriaQuery<FeedbackResponse> dataQuery = cb.createQuery(FeedbackResponse.class);
        Root<FeedbackResponse> root = dataQuery.from(FeedbackResponse.class);
        dataQuery.where(buildPredicates(cb, root, branchId, serviceType, rating, search));
        dataQuery.orderBy(cb.desc(root.get("createdAt")));

        List<FeedbackResponse> results = entityManager.createQuery(dataQuery)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();

        List<FeedbackResponseDto> dtos = results.stream().map(this::toDto).collect(Collectors.toList());
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return new PageImpl<>(dtos, pageable, total);
    }

    private Predicate[] buildPredicates(
            CriteriaBuilder cb, Root<FeedbackResponse> root,
            String branchId, String serviceType, Integer rating, String search) {

        List<Predicate> predicates = new ArrayList<>();

        if (branchId != null && !branchId.isBlank()) {
            try {
                predicates.add(cb.equal(root.get("branchId"), Long.parseLong(branchId)));
            } catch (NumberFormatException ignored) {}
        }

        if (serviceType != null && !serviceType.isBlank()) {
            predicates.add(cb.equal(root.get("serviceType"), serviceType));
        }

        if (rating != null) {
            predicates.add(cb.equal(root.get("overallRating"), rating));
        }

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("branchName")), pattern),
                    cb.like(cb.lower(root.get("additionalComments")), pattern),
                    cb.like(cb.lower(root.get("serviceType")), pattern)
            ));
        }

        return predicates.toArray(new Predicate[0]);
    }

    public FeedbackResponseDto getFeedbackById(Long id) {
        return feedbackRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + id));
    }

    private FeedbackResponseDto toDto(FeedbackResponse f) {
        return FeedbackResponseDto.builder()
                .id(f.getId() != null ? f.getId().toString() : null)
                .date(f.getCreatedAt() != null ? f.getCreatedAt().format(DATE_FMT) : "")
                .time(f.getCreatedAt() != null ? f.getCreatedAt().format(TIME_FMT) : "")
                .customerService(f.getCustomerServiceRating())
                .branchEnvironment(f.getBranchEnvironmentRating())
                .recommendation(f.getRecommendationRating())
                .additionalComments(f.getAdditionalComments())
                .branch(f.getBranchName())
                .branchId(f.getBranchId() != null ? f.getBranchId().toString() : "")
                .serviceType(f.getServiceType())
                .overallRating(f.getOverallRating())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
