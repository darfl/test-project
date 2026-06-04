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

        // Net balance per person: obligation - contribution
        // Positive = must pay, Negative = must receive
        Map<String, Double> balance = new LinkedHashMap<>();

        for (ParticipantDto p : participants) {
            String name = p.getName();
            // Obligation: personal order + share of shared items
            double obligation = p.getAmount() + sharedPerPerson;
            // Contribution: personal order to organizer + shared items they paid + explicit contribution
            double contribution = 0;
            if (name.equals(organizerName)) {
                contribution += personalTotal; // organizer paid the full bill
            }
            contribution += p.getContribution(); // explicit contribution

            balance.put(name, obligation - contribution);
        }

        // Add shared item contributions
        for (SharedItemDto s : sharedItems) {
            if (s.getPaidBy() != null && !s.getPaidBy().isEmpty()) {
                balance.merge(s.getPaidBy(), -s.getAmount(), Double::sum); // contribution increases, balance decreases
            }
        }

        // Round balances
        for (String name : balance.keySet()) {
            balance.put(name, Math.round(balance.get(name) * 100.0) / 100.0);
        }

        // Greedy settlement: minimize transactions
        List<DebtDto> debts = new ArrayList<>();

        List<Map.Entry<String, Double>> positives = new ArrayList<>(); // owes
        List<Map.Entry<String, Double>> negatives = new ArrayList<>(); // owed

        for (Map.Entry<String, Double> e : balance.entrySet()) {
            double val = e.getValue();
            if (val > 0.001) positives.add(new AbstractMap.SimpleEntry<>(e.getKey(), val));
            if (val < -0.001) negatives.add(new AbstractMap.SimpleEntry<>(e.getKey(), -val));
        }

        // Sort descending: biggest debtor first, biggest creditor first
        positives.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
        negatives.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        int pi = 0, ni = 0;
        while (pi < positives.size() && ni < negatives.size()) {
            Map.Entry<String, Double> debtor = positives.get(pi);
            Map.Entry<String, Double> creditor = negatives.get(ni);

            double amount = Math.min(debtor.getValue(), creditor.getValue());
            amount = Math.round(amount * 100.0) / 100.0;

            if (amount >= 0.01) {
                debts.add(new DebtDto(debtor.getKey(), creditor.getKey(), amount));
            }

            double newDebtorVal = Math.round((debtor.getValue() - amount) * 100.0) / 100.0;
            double newCreditorVal = Math.round((creditor.getValue() - amount) * 100.0) / 100.0;

            if (newDebtorVal < 0.01) pi++;
            else positives.set(pi, new AbstractMap.SimpleEntry<>(debtor.getKey(), newDebtorVal));

            if (newCreditorVal < 0.01) ni++;
            else negatives.set(ni, new AbstractMap.SimpleEntry<>(creditor.getKey(), newCreditorVal));
        }

        // Pressure data
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