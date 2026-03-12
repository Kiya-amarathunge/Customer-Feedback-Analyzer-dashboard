package com.lolc.feedback.repository;

import com.lolc.feedback.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeNumber(String employeeNumber);
    boolean existsByEmployeeNumber(String employeeNumber);
    List<Employee> findByActiveTrue();
    List<Employee> findByBranchId(Long branchId);
}