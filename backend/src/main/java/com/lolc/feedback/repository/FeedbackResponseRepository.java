package com.lolc.feedback.repository;

import com.lolc.feedback.model.FeedbackResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FeedbackResponseRepository extends JpaRepository<FeedbackResponse, Long> {
    List<FeedbackResponse> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByIpAddressAndCreatedAtAfter(String ipAddress, LocalDateTime after);
}
