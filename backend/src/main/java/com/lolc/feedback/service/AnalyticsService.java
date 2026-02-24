package com.lolc.feedback.service;

import com.lolc.feedback.dto.AnalyticsSummaryDto;
import com.lolc.feedback.model.FeedbackResponse;
import com.lolc.feedback.repository.FeedbackResponseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private FeedbackResponseRepository feedbackRepository;

    // ── Summary ────────────────────────────────────────────────────────────────
    // No branch filter on summary — it is always global
    public AnalyticsSummaryDto getSummary() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thisMonthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime lastMonthStart = thisMonthStart.minusMonths(1);
        LocalDateTime lastMonthEnd   = thisMonthStart.minusSeconds(1);

        List<FeedbackResponse> all       = feedbackRepository.findAll();
        List<FeedbackResponse> thisMonth = feedbackRepository.findByCreatedAtBetween(thisMonthStart, now);
        List<FeedbackResponse> lastMonth = feedbackRepository.findByCreatedAtBetween(lastMonthStart, lastMonthEnd);

        long totalFeedback = all.size();

        double avgRating = all.stream()
                .mapToInt(FeedbackResponse::getOverallRating)
                .average().orElse(0.0);

        long promoters  = all.stream().filter(f -> f.getRecommendationRating() == 5).count();
        long detractors = all.stream().filter(f -> f.getRecommendationRating() <= 2).count();
        int nps = totalFeedback > 0
                ? (int) Math.round(((double)(promoters - detractors) / totalFeedback) * 100)
                : 0;

        double thisAvg   = thisMonth.stream().mapToInt(FeedbackResponse::getOverallRating).average().orElse(0);
        double lastAvg   = lastMonth.stream().mapToInt(FeedbackResponse::getOverallRating).average().orElse(0);
        double ratingChange = Math.round((thisAvg - lastAvg) * 10.0) / 10.0;

        double countChange = lastMonth.isEmpty() ? 0
                : Math.round(((double)(thisMonth.size() - lastMonth.size()) / lastMonth.size()) * 1000.0) / 10.0;

        // NPS change: compute last month NPS vs this month NPS
        long thisPromoters  = thisMonth.stream().filter(f -> f.getRecommendationRating() == 5).count();
        long thisDetractors = thisMonth.stream().filter(f -> f.getRecommendationRating() <= 2).count();
        int thisNps = thisMonth.isEmpty() ? 0
                : (int) Math.round(((double)(thisPromoters - thisDetractors) / thisMonth.size()) * 100);

        long lastPromoters  = lastMonth.stream().filter(f -> f.getRecommendationRating() == 5).count();
        long lastDetractors = lastMonth.stream().filter(f -> f.getRecommendationRating() <= 2).count();
        int lastNps = lastMonth.isEmpty() ? 0
                : (int) Math.round(((double)(lastPromoters - lastDetractors) / lastMonth.size()) * 100);

        double npsChange = thisNps - lastNps;

        return AnalyticsSummaryDto.builder()
                .totalFeedback(totalFeedback)
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .npsScore(nps)
                .responseRate(totalFeedback > 0 ? 100.0 : 0.0)
                .totalFeedbackChange(countChange)
                .averageRatingChange(ratingChange)
                .npsScoreChange(npsChange)
                .responseRateChange(countChange)
                .build();
    }

    // ── Trends ─────────────────────────────────────────────────────────────────
    // Supports fromMonth and toMonth in format "YYYY-MM"
    // branchId is optional — if provided, only shows data for that branch
    public List<Map<String, Object>> getTrends(String fromMonth, String toMonth, String branchId) {
        List<Map<String, Object>> trends = new ArrayList<>();

        // Parse fromMonth / toMonth e.g. "2026-01"
        YearMonth from = (fromMonth != null && !fromMonth.isBlank())
                ? YearMonth.parse(fromMonth) : YearMonth.of(2026, 1);
        YearMonth to = (toMonth != null && !toMonth.isBlank())
                ? YearMonth.parse(toMonth) : YearMonth.now();

        // Ensure from is not after to
        if (from.isAfter(to)) from = to;

        String[] monthNames = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};

        YearMonth current = from;
        while (!current.isAfter(to)) {
            LocalDateTime monthStart = current.atDay(1).atStartOfDay();
            LocalDateTime monthEnd   = current.atEndOfMonth().atTime(23, 59, 59);

            List<FeedbackResponse> monthData = feedbackRepository.findByCreatedAtBetween(monthStart, monthEnd);

            // Filter by branch if specified
            if (branchId != null && !branchId.isBlank()) {
                final String bid = branchId;
                monthData = monthData.stream()
                        .filter(f -> bid.equals(f.getBranchId()))
                        .collect(Collectors.toList());
            }

            final List<FeedbackResponse> data = monthData;
            Map<String, Object> point = new LinkedHashMap<>();
            // Label: "Jan 2026" style
            point.put("month", monthNames[current.getMonthValue() - 1] + " " + current.getYear());
            point.put("customerService",  round2(data.stream().mapToInt(FeedbackResponse::getCustomerServiceRating).average().orElse(0)));
            point.put("branchEnvironment", round2(data.stream().mapToInt(FeedbackResponse::getBranchEnvironmentRating).average().orElse(0)));
            point.put("recommendation",   round2(data.stream().mapToInt(FeedbackResponse::getRecommendationRating).average().orElse(0)));
            point.put("count", data.size());
            trends.add(point);

            current = current.plusMonths(1);
        }

        return trends;
    }

    // ── Rating Distribution ────────────────────────────────────────────────────
    // branchId optional — if provided, only shows ratings for that branch
    public List<Map<String, Object>> getRatingDistribution(String branchId) {
        List<FeedbackResponse> all = feedbackRepository.findAll();

        // Filter by branch if provided
        if (branchId != null && !branchId.isBlank()) {
            final String bid = branchId;
            all = all.stream()
                    .filter(f -> bid.equals(f.getBranchId()))
                    .collect(Collectors.toList());
        }

        final List<FeedbackResponse> data = all;
        String[] categories = {"Customer Service", "Branch Environment", "Recommendation"};
        List<Map<String, Object>> result = new ArrayList<>();

        for (String cat : categories) {
            Map<String, Object> dist = new LinkedHashMap<>();
            dist.put("category", cat);
            for (int star = 5; star >= 1; star--) {
                final int s = star;
                long count = switch (cat) {
                    case "Customer Service"   -> data.stream().filter(f -> f.getCustomerServiceRating() == s).count();
                    case "Branch Environment" -> data.stream().filter(f -> f.getBranchEnvironmentRating() == s).count();
                    default                   -> data.stream().filter(f -> f.getRecommendationRating() == s).count();
                };
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

    // ── Branch Performance ─────────────────────────────────────────────────────
    // Returns all branches sorted by average rating descending
    public List<Map<String, Object>> getBranchPerformance() {
        List<FeedbackResponse> all = feedbackRepository.findAll();
        Map<String, List<FeedbackResponse>> byBranch = new LinkedHashMap<>();

        for (FeedbackResponse f : all) {
            String key = f.getBranchId() != null ? f.getBranchId() : f.getBranchName();
            byBranch.computeIfAbsent(key, k -> new ArrayList<>()).add(f);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        byBranch.forEach((branchKey, feedbacks) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("branchName",    feedbacks.get(0).getBranchName());
            item.put("branchId",      feedbacks.get(0).getBranchId() != null ? feedbacks.get(0).getBranchId() : "");
            item.put("averageRating", round2(feedbacks.stream().mapToInt(FeedbackResponse::getOverallRating).average().orElse(0)));
            item.put("totalFeedback", feedbacks.size());
            result.add(item);
        });

        result.sort((a, b) -> Double.compare((double) b.get("averageRating"), (double) a.get("averageRating")));
        return result;
    }

    // ── Service Distribution ───────────────────────────────────────────────────
    // branchId optional — if provided, only shows distribution for that branch
    public List<Map<String, Object>> getServiceDistribution(String branchId) {
        List<FeedbackResponse> all = feedbackRepository.findAll();

        // Filter by branch if provided
        if (branchId != null && !branchId.isBlank()) {
            final String bid = branchId;
            all = all.stream()
                    .filter(f -> bid.equals(f.getBranchId()))
                    .collect(Collectors.toList());
        }

        // Always include all 4 service types even if count is 0
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("Loans",     0L);
        counts.put("Savings",   0L);
        counts.put("Insurance", 0L);
        counts.put("Leasing",   0L);

        for (FeedbackResponse f : all) {
            String svc = f.getServiceType() != null ? f.getServiceType() : "Other";
            counts.merge(svc, 1L, Long::sum);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        counts.forEach((name, value) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name",  name);
            item.put("value", value);
            result.add(item);
        });
        return result;
    }

    // ── Helper ─────────────────────────────────────────────────────────────────
    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
