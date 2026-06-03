package com.splitter.controller;

import com.splitter.dto.SplitRequest;
import com.splitter.dto.SplitResponse;
import com.splitter.service.SplitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/split")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class SplitController {

    private final SplitService splitService;

    public SplitController(SplitService splitService) {
        this.splitService = splitService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<SplitResponse> calculate(@RequestBody SplitRequest request) {
        SplitResponse response = splitService.calculate(request);
        return ResponseEntity.ok(response);
    }
}