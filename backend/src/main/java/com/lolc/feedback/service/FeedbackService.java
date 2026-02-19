package com.lolc.feedback.service;

import com.lolc.feedback.dto.FeedbackRequestDto;
import com.lolc.feedback.dto.FeedbackResponseDto;
import com.lolc.feedback.model.Branch;
import com.lolc.feedback.model.FeedbackResponse;
import com.lolc.feedback.repository.BranchRepository;
import com.lolc.feedback.repository.FeedbackResponseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackResponseRepository feedbackRepository;

    @Autowired
    private BranchRepository branchRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    public FeedbackResponseDto submitFeedback(FeedbackRequestDto request, String ipAddress) {
        // Rate limiting check
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentCount = feedbackRepository.countByIpAddressAndCreatedAtAfter(ipAddress, oneHourAgo);
        if (recentCount >= 20) {
            throw new RuntimeException("Rate limit exceeded. Please try again later.");
        }

        // Resolve branch name
        String branchName = "Unknown Branch";
        if (request.getBranchId() != null) {
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

    public Page<FeedbackResponseDto> getAllFeedback(String branchId, String serviceType,
                                                    Integer rating, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<FeedbackResponse> results = feedbackRepository.findAll(pageable);
        return results.map(this::toDto);
    }

    public FeedbackResponseDto getFeedbackById(String id) {
        return feedbackRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + id));
    }

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
