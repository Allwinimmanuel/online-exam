/* ============================================
   Evaluator — Answer Scoring & Analysis Engine
   ============================================ */

const Evaluator = (() => {
  // Synonym map for keyword matching
  const SYNONYMS = {
    'array': ['arrays', 'list', 'collection', 'arr'],
    'function': ['method', 'subroutine', 'procedure', 'func'],
    'object': ['instance', 'obj', 'entity'],
    'class': ['blueprint', 'template', 'type'],
    'variable': ['var', 'identifier', 'symbol'],
    'database': ['db', 'datastore', 'storage'],
    'algorithm': ['algo', 'procedure', 'method'],
    'complexity': ['big-o', 'time complexity', 'space complexity', 'performance'],
    'inheritance': ['extends', 'subclass', 'derive', 'inherits'],
    'polymorphism': ['overloading', 'overriding', 'many forms'],
    'encapsulation': ['data hiding', 'access control', 'private'],
    'abstraction': ['abstract', 'interface', 'generalization'],
    'normalization': ['1nf', '2nf', '3nf', 'bcnf', 'normal form'],
    'index': ['indexing', 'indexed', 'b-tree', 'hash index'],
    'transaction': ['acid', 'commit', 'rollback'],
    'process': ['task', 'program in execution'],
    'thread': ['lightweight process', 'multithreading', 'concurrent'],
    'deadlock': ['circular wait', 'mutual exclusion', 'resource conflict'],
    'tcp': ['transmission control protocol', 'reliable', 'connection-oriented'],
    'http': ['hypertext transfer protocol', 'web protocol', 'request-response'],
    'recursion': ['recursive', 'self-calling', 'base case'],
    'stack': ['lifo', 'last in first out', 'push pop'],
    'queue': ['fifo', 'first in first out', 'enqueue dequeue'],
    'tree': ['binary tree', 'bst', 'hierarchical'],
    'graph': ['vertices', 'edges', 'nodes', 'network'],
    'hash': ['hashing', 'hash table', 'hash map', 'dictionary'],
    'sort': ['sorting', 'quicksort', 'mergesort', 'bubblesort'],
    'search': ['searching', 'binary search', 'linear search'],
    'api': ['application programming interface', 'endpoint', 'rest'],
    'sql': ['structured query language', 'query'],
    'join': ['inner join', 'outer join', 'left join', 'right join'],
  };

  function evaluateAnswer(question, answer) {
    if (!answer || answer.trim().length === 0) {
      return {
        score: 0,
        grade: 'F',
        feedback: 'No answer provided.',
        keywordsFound: [],
        keywordsMissed: question.keywords || [],
        completeness: 0,
        confidence: 0,
        suggestions: ['Try to provide an answer, even if partial.'],
      };
    }

    const answerLower = answer.toLowerCase().trim();
    const answerWords = answerLower.split(/\s+/);
    const keywords = question.keywords || [];

    // 1. Keyword Analysis
    const keywordsFound = [];
    const keywordsMissed = [];

    keywords.forEach(kw => {
      const kwLower = kw.toLowerCase();
      let found = false;

      // Direct match
      if (answerLower.includes(kwLower)) {
        found = true;
      }

      // Synonym match
      if (!found) {
        const synonyms = SYNONYMS[kwLower] || [];
        for (const syn of synonyms) {
          if (answerLower.includes(syn.toLowerCase())) {
            found = true;
            break;
          }
        }
      }

      // Partial match (at least 70% of keyword characters)
      if (!found && kwLower.length > 4) {
        for (const word of answerWords) {
          if (word.length >= kwLower.length * 0.7 && _levenshteinSimilarity(word, kwLower) > 0.7) {
            found = true;
            break;
          }
        }
      }

      if (found) {
        keywordsFound.push(kw);
      } else {
        keywordsMissed.push(kw);
      }
    });

    // 2. Keyword Score (50% weight)
    const keywordScore = keywords.length > 0
      ? (keywordsFound.length / keywords.length) * 100
      : 50;

    // 3. Completeness Score (25% weight)
    const idealLength = question.idealAnswer ? question.idealAnswer.length : 200;
    const lengthRatio = Math.min(answerLower.length / idealLength, 1.5);
    let completenessScore;
    if (lengthRatio < 0.2) completenessScore = 20;
    else if (lengthRatio < 0.4) completenessScore = 40;
    else if (lengthRatio < 0.7) completenessScore = 60;
    else if (lengthRatio <= 1.2) completenessScore = 90;
    else completenessScore = 75; // Too long might mean rambling

    // 4. Relevance Score (15% weight)
    let relevanceScore = 50;
    if (question.idealAnswer) {
      const idealWords = new Set(question.idealAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const answerRelevantWords = answerWords.filter(w => w.length > 3);
      let matches = 0;
      answerRelevantWords.forEach(w => {
        if (idealWords.has(w)) matches++;
      });
      relevanceScore = Math.min((matches / Math.max(idealWords.size, 1)) * 150, 100);
    }

    // 5. Structure Score (10% weight)
    let structureScore = 50;
    const hasSentences = answer.includes('.');
    const hasMultiplePoints = (answer.match(/\n/g) || []).length >= 2 || (answer.match(/[.!?]/g) || []).length >= 3;
    const hasExamples = /example|for instance|such as|e\.g\.|like /i.test(answer);
    if (hasSentences) structureScore += 15;
    if (hasMultiplePoints) structureScore += 20;
    if (hasExamples) structureScore += 15;
    structureScore = Math.min(structureScore, 100);

    // 6. Final Score
    const finalScore = Math.round(
      keywordScore * 0.50 +
      completenessScore * 0.25 +
      relevanceScore * 0.15 +
      structureScore * 0.10
    );

    // 7. Grade
    const grade = _calculateGrade(finalScore);

    // 8. Confidence (based on answer length, speed, specificity)
    const confidence = Math.min(Math.round(
      (lengthRatio > 0.3 ? 30 : 10) +
      (keywordsFound.length > 0 ? 30 : 0) +
      (hasSentences ? 15 : 0) +
      (hasExamples ? 15 : 0) +
      (lengthRatio > 0.6 ? 10 : 0)
    ), 100);

    // 9. Feedback & Suggestions
    const feedback = _generateFeedback(finalScore, keywordsFound, keywordsMissed, completenessScore, answer);
    const suggestions = _generateSuggestions(keywordsMissed, completenessScore, structureScore, answer);

    return {
      score: finalScore,
      grade,
      feedback,
      keywordsFound,
      keywordsMissed,
      completeness: Math.round(completenessScore),
      relevance: Math.round(relevanceScore),
      structure: Math.round(structureScore),
      confidence,
      suggestions,
      breakdown: {
        keyword: Math.round(keywordScore),
        completeness: Math.round(completenessScore),
        relevance: Math.round(relevanceScore),
        structure: Math.round(structureScore),
      },
    };
  }

  function _calculateGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 45) return 'D';
    return 'F';
  }

  function _generateFeedback(score, found, missed, completeness, answer) {
    if (score >= 85) return 'Excellent answer! You demonstrated strong understanding of the topic.';
    if (score >= 70) return 'Good answer with solid key points. A few areas could be expanded.';
    if (score >= 55) return 'Decent attempt. You covered some important points but missed key concepts.';
    if (score >= 40) return 'Your answer needs improvement. Important concepts were missing.';
    if (score >= 20) return 'The answer was too brief or off-topic. Review this topic thoroughly.';
    return 'The answer did not address the question adequately.';
  }

  function _generateSuggestions(missed, completeness, structure, answer) {
    const suggestions = [];

    if (missed.length > 0) {
      suggestions.push(`Include these key concepts: ${missed.slice(0, 3).join(', ')}`);
    }
    if (completeness < 50) {
      suggestions.push('Provide a more detailed explanation with examples.');
    }
    if (structure < 50) {
      suggestions.push('Structure your answer better — use complete sentences and examples.');
    }
    if (answer.length < 50) {
      suggestions.push('Your answer is too short. Elaborate on the main points.');
    }
    if (!(/example|for instance|such as|e\.g\./i.test(answer))) {
      suggestions.push('Include real-world examples to strengthen your answer.');
    }

    return suggestions.length > 0 ? suggestions : ['Keep practicing to maintain this level!'];
  }

  function _levenshteinSimilarity(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - matrix[a.length][b.length] / maxLen;
  }

  // ── Session Analysis ──
  function analyzeSession(results) {
    if (!results || results.length === 0) {
      return {
        totalScore: 0,
        grade: 'F',
        strengths: [],
        weaknesses: ['Interview terminated prematurely.'],
        communicationScore: 0,
        avgResponseTime: 0,
        questionResults: [],
        topMissedKeywords: [],
      };
    }

    const scores = results.map(r => r.evaluation.score);
    const totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const grade = _calculateGrade(totalScore);

    // Strengths & Weaknesses
    const strengths = [];
    const weaknesses = [];

    const highScoreQs = results.filter(r => r.evaluation.score >= 70);
    const lowScoreQs = results.filter(r => r.evaluation.score < 50);

    if (highScoreQs.length > results.length * 0.6) strengths.push('Strong conceptual understanding');
    if (results.every(r => r.evaluation.completeness > 60)) strengths.push('Good at providing detailed answers');
    if (results.some(r => r.evaluation.structure > 70)) strengths.push('Well-structured responses');

    if (lowScoreQs.length > results.length * 0.3) weaknesses.push('Need to strengthen core concepts');
    if (results.some(r => r.evaluation.completeness < 40)) weaknesses.push('Answers tend to be too brief');
    if (results.every(r => r.evaluation.structure < 60)) weaknesses.push('Work on answer structure and examples');

    // All missed keywords across session
    const allMissed = {};
    results.forEach(r => {
      (r.evaluation.keywordsMissed || []).forEach(kw => {
        allMissed[kw] = (allMissed[kw] || 0) + 1;
      });
    });

    const topMissedKeywords = Object.entries(allMissed)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw]) => kw);

    // Communication score
    const avgCompleteness = Math.round(results.reduce((a, r) => a + r.evaluation.completeness, 0) / results.length);
    const avgConfidence = Math.round(results.reduce((a, r) => a + r.evaluation.confidence, 0) / results.length);
    const communicationScore = Math.round((avgCompleteness + avgConfidence) / 2);

    // Time analysis
    const avgResponseTime = Math.round(results.reduce((a, r) => a + (r.responseTime || 0), 0) / results.length);

    return {
      totalScore,
      grade,
      questionsAnswered: results.length,
      strengths: strengths.length > 0 ? strengths : ['Continue building your knowledge base'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Keep practicing for consistency'],
      topMissedKeywords,
      communicationScore,
      avgResponseTime,
      avgCompleteness,
      avgConfidence,
      questionResults: results,
    };
  }

  return { evaluateAnswer, analyzeSession };
})();
