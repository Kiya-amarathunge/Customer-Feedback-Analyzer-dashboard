package com.lolc.feedback.repository;

import com.lolc.feedback.model.FeedbackLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackLinkRepository extends JpaRepository<FeedbackLink, Long> {
    Optional<FeedbackLink> findByToken(String token);
    List<FeedbackLink> findAllByOrderByCreatedAtDesc();
    List<FeedbackLink> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<FeedbackLink> findByStatusOrderByCreatedAtDesc(String status);
    List<FeedbackLink> findByEmployeeNumberOrderByCreatedAtDesc(String employeeNumber);

    @Query("SELECT COUNT(l) FROM FeedbackLink l WHERE l.status = ?1")
    long countByStatus(String status);

    @Query("SELECT COUNT(l) FROM FeedbackLink l WHERE l.employeeId = ?1")
    long countByEmployeeId(Long employeeId);
}
