package com.splitter.service;

import com.splitter.dto.*;
import org.springframework.stereotype.Service;

import java.util.*;

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

        // Collect names
        List<String> names = new ArrayList<>();
        for (ParticipantDto p : participants) {
            names.add(p.getName() != null ? p.getName() : "");
        }

        // Personal amounts from items
        Map<String, Double> personalAmounts = new LinkedHashMap<>();
        double personalTotal = 0;
        for (int i = 0; i < participants.size(); i++) {
            ParticipantDto p = participants.get(i);
            String name = names.get(i);
            double sum = 0;
            if (p.getItems() != null) {
                for (OrderItemDto it : p.getItems()) {
                    sum += it.getAmount();
                }
            }
            sum = Math.round(sum * 100.0) / 100.0;
            personalAmounts.put(name, sum);
            personalTotal += sum;
        }

        // Net balance per person
        Map<String, Double> balance = new LinkedHashMap<>();
        for (String name : names) {
            balance.put(name, 0.0);
        }

        // 1. Personal orders: each person owes their personal total to the organizer
        for (String name : names) {
            if (!name.equals(organizerName)) {
                double amt = personalAmounts.get(name);
                balance.merge(name, amt, Double::sum);
                balance.merge(organizerName, -amt, Double::sum);
            }
        }

        // 2. Shared items: split among selected participants (or all if empty)
        double sharedTotal = 0;
        for (SharedItemDto s : sharedItems) {
            sharedTotal += s.getAmount();
            List<String> sharedWith = (s.getSharedWith() != null && !s.getSharedWith().isEmpty())
                    ? s.getSharedWith()
                    : names;

            int shareCount = sharedWith.size();
            if (shareCount == 0) continue;
            double share = Math.round((s.getAmount() / shareCount) * 100.0) / 100.0;

            for (String nm : sharedWith) {
                balance.merge(nm, share, Double::sum);
            }

            // Contributor (who paid) gets the full amount credited
            String payer = (s.getPaidBy() != null && !s.getPaidBy().isEmpty()) ? s.getPaidBy() : organizerName;
            balance.merge(payer, -s.getAmount(), Double::sum);

            // Handle rounding
            double totalShares = Math.round(share * shareCount * 100.0) / 100.0;
            double diff = Math.round((s.getAmount() - totalShares) * 100.0) / 100.0;
            if (Math.abs(diff) > 0.001 && !sharedWith.isEmpty()) {
                balance.merge(sharedWith.get(sharedWith.size() - 1), diff, Double::sum);
            }
        }

        // 3. Explicit contributions
        for (int i = 0; i < participants.size(); i++) {
            ParticipantDto p = participants.get(i);
            String name = names.get(i);
            if (p.getContribution() > 0.001) {
                balance.merge(name, -p.getContribution(), Double::sum);
                balance.merge(organizerName, p.getContribution(), Double::sum);
            }
        }

        // Round all balances
        for (String name : balance.keySet()) {
            balance.put(name, Math.round(balance.get(name) * 100.0) / 100.0);
        }

        double total = personalTotal + sharedTotal;
        double average = n > 0 ? total / n : 0;
        double roundedAverage = Math.round(average * 100.0) / 100.0;

        // Greedy settlement
        List<DebtDto> debts = new ArrayList<>();
        List<Map.Entry<String, Double>> positives = new ArrayList<>();
        List<Map.Entry<String, Double>> negatives = new ArrayList<>();

        for (Map.Entry<String, Double> e : balance.entrySet()) {
            double val = e.getValue();
            if (val > 0.001) positives.add(new AbstractMap.SimpleEntry<>(e.getKey(), val));
            if (val < -0.001) negatives.add(new AbstractMap.SimpleEntry<>(e.getKey(), -val));
        }

        positives.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
        negatives.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        int pi = 0, ni = 0;
        while (pi < positives.size() && ni < negatives.size()) {
            Map.Entry<String, Double> debtor = positives.get(pi);
            Map.Entry<String, Double> creditor = negatives.get(ni);
            double amount = Math.round(Math.min(debtor.getValue(), creditor.getValue()) * 100.0) / 100.0;
            if (amount >= 0.01) {
                debts.add(new DebtDto(debtor.getKey(), creditor.getKey(), amount));
            }
            double newD = Math.round((debtor.getValue() - amount) * 100.0) / 100.0;
            double newC = Math.round((creditor.getValue() - amount) * 100.0) / 100.0;
            if (newD < 0.01) pi++;
            else positives.set(pi, new AbstractMap.SimpleEntry<>(debtor.getKey(), newD));
            if (newC < 0.01) ni++;
            else negatives.set(ni, new AbstractMap.SimpleEntry<>(creditor.getKey(), newC));
        }

        // Pressure data
        List<PressureDto> pressureData = new ArrayList<>();
        for (int i = 0; i < participants.size(); i++) {
            String name = names.get(i);
            double ob = balance.getOrDefault(name, 0.0);
            double dev = average > 0 ? Math.round(((ob - average) / average) * 100.0) : 0;
            int d = (int) dev;
            String level = d > 70 ? "HIGH" : d > 30 ? "MEDIUM" : "LOW";
            pressureData.add(new PressureDto(name, d, level));
        }

        return new SplitResponse(roundedAverage, Math.round(total * 100.0) / 100.0, debts, pressureData);
    }
}