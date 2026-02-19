package com.lolc.feedback.controller;

import com.lolc.feedback.model.Branch;
import com.lolc.feedback.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    @Autowired
    private BranchRepository branchRepository;

    @GetMapping
    public ResponseEntity<List<Branch>> getBranches() {
        return ResponseEntity.ok(branchRepository.findByActiveTrue());
    }
}
