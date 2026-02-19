package com.lolc.feedback.service;

import com.lolc.feedback.dto.AnalyticsSummaryDto;
import com.lolc.feedback.model.FeedbackResponse;
import com.lolc.feedback.repository.FeedbackResponseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AnalyticsService {

    @Autowired
    private FeedbackResponseRepository feedbackRepository;

    public AnalyticsSummaryDto getSummary() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thisMonthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime lastMonthStart = thisMonthStart.minusMonths(1);
        LocalDateTime lastMonthEnd = thisMonthStart.minusSeconds(1);

        List<FeedbackResponse> thisMonth = feedbackRepository.findByCreatedAtBetween(thisMonthStart, now);
        List<FeedbackResponse> lastMonth = feedbackRepository.findByCreatedAtBetween(lastMonthStart, lastMonthEnd);
        List<FeedbackResponse> all = feedbackRepository.findAll();

        long totalFeedback = all.size();

        double avgRating = all.stream()
                .mapToInt(FeedbackResponse::getOverallRating)
                .average()
                .orElse(0.0);

        // Compute NPS: % promoters (5) - % detractors (1-2)
        long promoters = all.stream().filter(f -> f.getRecommendationRating() == 5).count();
        long detractors = all.stream().filter(f -> f.getRecommendationRating() <= 2).count();
        int nps = totalFeedback > 0
                ? (int) Math.round(((double) (promoters - detractors) / totalFeedback) * 100)
                : 0;

        // Month-over-month changes
        double thisAvg = thisMonth.stream().mapToInt(FeedbackResponse::getOverallRating).average().orElse(0);
        double lastAvg = lastMonth.stream().mapToInt(FeedbackResponse::getOverallRating).average().orElse(0);
        double ratingChange = Math.round((thisAvg - lastAvg) * 10.0) / 10.0;

        double countChange = lastMonth.isEmpty() ? 0
                : Math.round(((double) (thisMonth.size() - lastMonth.size()) / lastMonth.size()) * 1000.0) / 10.0;

        return AnalyticsSummaryDto.builder()
                .totalFeedback(totalFeedback)
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .npsScore(nps)
                .responseRate(68.0) // Would come from QR scan tracking
                .totalFeedbackChange(countChange)
                .averageRatingChange(ratingChange)
                .npsScoreChange(8.0) // Would be computed vs last period
                .responseRateChange(-3.2)
                .build();
    }

    public List<Map<String, Object>> getTrends(int months) {
        List<Map<String, Object>> trends = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

        for (int i = months - 1; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);

            List<FeedbackResponse> monthData = feedbackRepository.findByCreatedAtBetween(monthStart, monthEnd);

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", monthNames[monthStart.getMonthValue() - 1]);
            point.put("customerService", monthData.stream().mapToInt(FeedbackResponse::getCustomerServiceRating).average().orElse(0));
            point.put("branchEnvironment", monthData.stream().mapToInt(FeedbackResponse::getBranchEnvironmentRating).average().orElse(0));
            point.put("recommendation", monthData.stream().mapToInt(FeedbackResponse::getRecommendationRating).average().orElse(0));
            point.put("count", monthData.size());
            trends.add(point);
        }

        return trends;
    }

    public List<Map<String, Object>> getRatingDistribution() {
        List<FeedbackResponse> all = feedbackRepository.findAll();
        String[] categories = {"Customer Service", "Branch Environment", "Recommendation"};

        List<Map<String, Object>> result = new ArrayList<>();
        for (String cat : categories) {
            Map<String, Object> dist = new LinkedHashMap<>();
            dist.put("category", cat);

            for (int star = 5; star >= 1; star--) {
                final int s = star;
                long count;
                switch (cat) {
                    case "Customer Service" -> count = all.stream().filter(f -> f.getCustomerServiceRating() == s).count();
                    case "Branch Environment" -> count = all.stream().filter(f -> f.getBranchEnvironmentRating() == s).count();
                    default -> count = all.stream().filter(f -> f.getRecommendationRating() == s).count();
                }
                String key = switch (star) {
                    case 5 -> "fiveStar";
                    case 4 -> "fourStar";
                    case 3 -> "threeStar";
                    case 2 -> "twoStar";
                    default -> "oneStar";
                };
                dist.put(key, count);
            }
            result.add(dist);
        }
        return result;
    }

    public List<Map<String, Object>> getBranchPerformance() {
        List<FeedbackResponse> all = feedbackRepository.findAll();
        Map<String, List<FeedbackResponse>> byBranch = new LinkedHashMap<>();

        for (FeedbackResponse f : all) {
            byBranch.computeIfAbsent(f.getBranchName(), k -> new ArrayList<>()).add(f);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        byBranch.forEach((branch, feedbacks) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("branchName", branch);
            item.put("branchId", feedbacks.isEmpty() ? "" : feedbacks.get(0).getBranchId());
            item.put("averageRating", feedbacks.stream().mapToInt(FeedbackResponse::getOverallRating).average().orElse(0));
            item.put("totalFeedback", feedbacks.size());
            result.add(item);
        });

        result.sort((a, b) -> Double.compare((double) b.get("averageRating"), (double) a.get("averageRating")));
        return result;
    }

    public List<Map<String, Object>> getServiceDistribution() {
        List<FeedbackResponse> all = feedbackRepository.findAll();
        Map<String, Long> counts = new LinkedHashMap<>();

        for (FeedbackResponse f : all) {
            String svc = f.getServiceType() != null ? f.getServiceType() : "Other";
            counts.merge(svc, 1L, Long::sum);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        counts.forEach((name, value) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", name);
            item.put("value", value);
            result.add(item);
        });
        return result;
    }
}
