package com.lolc.feedback.repository;

import com.lolc.feedback.model.FeedbackResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FeedbackResponseRepository extends MongoRepository<FeedbackResponse, String> {

    Page<FeedbackResponse> findByBranchId(String branchId, Pageable pageable);

    Page<FeedbackResponse> findByOverallRating(int rating, Pageable pageable);

    Page<FeedbackResponse> findByServiceType(String serviceType, Pageable pageable);

    Page<FeedbackResponse> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    @Query("{ 'createdAt': { $gte: ?0, $lte: ?1 }, 'branchId': { $in: ?2 } }")
    Page<FeedbackResponse> findByFilters(LocalDateTime from, LocalDateTime to, List<String> branchIds, Pageable pageable);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    long countByBranchId(String branchId);

    List<FeedbackResponse> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // For rate limiting
    long countByIpAddressAndCreatedAtAfter(String ipAddress, LocalDateTime after);
}
