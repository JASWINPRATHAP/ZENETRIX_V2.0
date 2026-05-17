package com.jaswin.incidentmanagement.similarity;

import org.springframework.stereotype.Component;
import java.util.HashSet;
import java.util.Set;

@Component
public class SimilarityCalculator {

    public double calculateJaccardSimilarity(String text1, String text2) {
        if (text1 == null || text2 == null) return 0.0;
        
        Set<String> set1 = tokenize(text1.toLowerCase());
        Set<String> set2 = tokenize(text2.toLowerCase());

        if (set1.isEmpty() && set2.isEmpty()) return 1.0;
        if (set1.isEmpty() || set2.isEmpty()) return 0.0;

        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);

        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);

        return (double) intersection.size() / union.size();
    }

    private Set<String> tokenize(String text) {
        Set<String> tokens = new HashSet<>();
        String[] words = text.split("\\W+"); // Split by non-word characters
        for (String word : words) {
            if (!word.trim().isEmpty()) {
                tokens.add(word);
            }
        }
        return tokens;
    }
}
