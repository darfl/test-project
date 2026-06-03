package com.splitter.service;

import com.splitter.dto.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SplitService {

    public SplitResponse calculate(SplitRequest request) {
        List<ParticipantDto> participants = request.getParticipants();
        List<SharedItemDto> sharedItems = request.getSharedItems() != null ? request.getSharedItems() : List.of();
        String organizerName = request.getOrganizerName();
        int n = participants.size();
        if (n == 0) {
            return new SplitResponse(0, 0, List.of(), List.of());
        }

        // Personal orders total
        double personalTotal = participants.stream()
                .mapToDouble(ParticipantDto::getAmount)
                .sum();

        // Shared items total
        double sharedTotal = sharedItems.stream()
                .mapToDouble(SharedItemDto::getAmount)
                .sum();

        double total = personalTotal + sharedTotal;
        double sharedPerPerson = n > 0 ? sharedTotal / n : 0;
        double average = n > 0 ? total / n : 0;
        double roundedAverage = Math.round(average * 100.0) / 100.0;

        // Build contributions map: personal contribution + sum of shared items they paid for
        Map<String, Double> contributions = new HashMap<>();
        for (ParticipantDto p : participants) {
            double contrib = p.getContribution();
            contributions.put(p.getName(), contrib);
        }

        // Add shared item amounts to the payer's contribution
        for (SharedItemDto s : sharedItems) {
            if (s.getPaidBy() != null && !s.getPaidBy().isEmpty()) {
                contributions.merge(s.getPaidBy(), s.getAmount(), Double::sum);
            }
        }

        // Build effective amounts per participant
        Map<String, Double> effectiveAmounts = new HashMap<>();
        for (ParticipantDto p : participants) {
            double personal = p.getAmount();
            effectiveAmounts.put(p.getName(), personal + sharedPerPerson);
        }

        // Net balance per person (positive = owes, negative = owed)
        Map<String, Double> balance = new HashMap<>();
        for (ParticipantDto p : participants) {
            double effective = effectiveAmounts.get(p.getName());
            double contrib = contributions.getOrDefault(p.getName(), 0.0);
            double net = Math.round((effective - contrib) * 100.0) / 100.0;
            balance.put(p.getName(), net);
        }

        // Debt settlement:
        // Each non-organizer owes effectiveAmount to organizer, minus their contributions.
        // If contributor overpaid (net negative), organizer owes them back.
        List<DebtDto> debts = new ArrayList<>();
        for (ParticipantDto p : participants) {
            String name = p.getName();
            if (!name.equals(organizerName)) {
                double netDebt = Math.round((effectiveAmounts.get(name) - contributions.getOrDefault(name, 0.0)) * 100.0) / 100.0;
                if (netDebt > 0) {
                    debts.add(new DebtDto(name, organizerName, netDebt));
                } else if (netDebt < 0) {
                    debts.add(new DebtDto(organizerName, name, -netDebt));
                }
            }
        }

        // Pressure data (based on effective amounts)
        List<PressureDto> pressureData = new ArrayList<>();
        for (ParticipantDto p : participants) {
            double effective = effectiveAmounts.get(p.getName());
            double deviationPercent = 0;
            if (average > 0) {
                deviationPercent = Math.round(((effective - average) / average) * 100.0);
            }
            int deviation = (int) deviationPercent;

            String level;
            if (deviation > 70) {
                level = "HIGH";
            } else if (deviation > 30) {
                level = "MEDIUM";
            } else {
                level = "LOW";
            }

            pressureData.add(new PressureDto(p.getName(), deviation, level));
        }

        return new SplitResponse(roundedAverage, Math.round(total * 100.0) / 100.0, debts, pressureData);
    }
}