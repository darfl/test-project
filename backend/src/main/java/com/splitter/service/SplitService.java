package com.splitter.service;

import com.splitter.dto.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SplitService {

    public SplitResponse calculate(SplitRequest request) {
        List<ParticipantDto> participants = request.getParticipants();
        List<SharedItemDto> sharedItems = request.getSharedItems() != null ? request.getSharedItems() : List.of();
        int n = participants.size();
        if (n == 0) {
            return new SplitResponse(0, 0, List.of(), List.of());
        }

        String organizerName = request.getOrganizerName();
        double personalTotal = participants.stream().mapToDouble(ParticipantDto::getAmount).sum();
        double sharedTotal = sharedItems.stream().mapToDouble(SharedItemDto::getAmount).sum();
        double total = personalTotal + sharedTotal;
        double sharedPerPerson = n > 0 ? sharedTotal / n : 0;
        double average = n > 0 ? total / n : 0;
        double roundedAverage = Math.round(average * 100.0) / 100.0;

        // Raw debts map: debtor -> { creditor -> amount }
        Map<String, Map<String, Double>> rawDebts = new LinkedHashMap<>();

        // 1. Each person owes their personal order amount to the organizer
        for (ParticipantDto p : participants) {
            String name = p.getName();
            if (!name.equals(organizerName)) {
                double amount = Math.round(p.getAmount() * 100.0) / 100.0;
                if (amount > 0.001) {
                    rawDebts.computeIfAbsent(name, k -> new LinkedHashMap<>())
                            .merge(organizerName, amount, Double::sum);
                }
            }
        }

        // 2. Each person owes sharedPerPerson to each shared item payer (excluding the payer themselves)
        for (SharedItemDto s : sharedItems) {
            String payer = s.getPaidBy();
            if (payer == null || payer.isEmpty() || sharedPerPerson < 0.001) continue;
            double share = Math.round(sharedPerPerson * 100.0) / 100.0;
            for (ParticipantDto p : participants) {
                String name = p.getName();
                if (!name.equals(payer)) {
                    rawDebts.computeIfAbsent(name, k -> new LinkedHashMap<>())
                            .merge(payer, share, Double::sum);
                }
            }
        }

        // 3. Mutual cancellation: if A owes B X and B owes A Y, cancel min(X, Y)
        for (String debtor : rawDebts.keySet()) {
            for (String creditor : rawDebts.getOrDefault(debtor, Map.of()).keySet()) {
                double forward = rawDebts.getOrDefault(debtor, Map.of()).getOrDefault(creditor, 0.0);
                double backward = rawDebts.getOrDefault(creditor, Map.of()).getOrDefault(debtor, 0.0);
                if (forward > 0.001 && backward > 0.001) {
                    double cancel = Math.min(forward, backward);
                    forward = Math.round((forward - cancel) * 100.0) / 100.0;
                    backward = Math.round((backward - cancel) * 100.0) / 100.0;
                    if (forward < 0.01) {
                        rawDebts.get(debtor).remove(creditor);
                    } else {
                        rawDebts.get(debtor).put(creditor, forward);
                    }
                    if (backward < 0.01) {
                        rawDebts.get(creditor).remove(debtor);
                    } else {
                        rawDebts.get(creditor).put(debtor, backward);
                    }
                }
            }
        }

        // 4. Build final debts list
        List<DebtDto> debts = new ArrayList<>();
        for (String debtor : rawDebts.keySet()) {
            Map<String, Double> creditors = rawDebts.get(debtor);
            if (creditors == null) continue;
            for (Map.Entry<String, Double> e : creditors.entrySet()) {
                if (e.getValue() > 0.001) {
                    debts.add(new DebtDto(debtor, e.getKey(), Math.round(e.getValue() * 100.0) / 100.0));
                }
            }
        }

        // 5. Pressure data
        List<PressureDto> pressureData = new ArrayList<>();
        for (ParticipantDto p : participants) {
            double ob = p.getAmount() + sharedPerPerson;
            double deviationPercent = 0;
            if (average > 0) {
                deviationPercent = Math.round(((ob - average) / average) * 100.0);
            }
            int deviation = (int) deviationPercent;
            String level;
            if (deviation > 70) level = "HIGH";
            else if (deviation > 30) level = "MEDIUM";
            else level = "LOW";
            pressureData.add(new PressureDto(p.getName(), deviation, level));
        }

        return new SplitResponse(roundedAverage, Math.round(total * 100.0) / 100.0, debts, pressureData);
    }
}