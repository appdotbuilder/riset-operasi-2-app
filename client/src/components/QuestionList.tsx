
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Question, ProgressReport } from '../../../server/src/schema';

interface QuestionListProps {
  questions: Question[];
  onQuestionSelect: (question: Question) => void;
  progressReport: ProgressReport | null;
}

export function QuestionList({ questions, onQuestionSelect, progressReport }: QuestionListProps) {
  const getQuestionStatus = (questionId: number) => {
    if (!progressReport) return 'not_answered';
    
    const answer = progressReport.answers.find(a => a.question_id === questionId);
    if (!answer) return 'not_answered';
    
    if (answer.status === 'pending') return 'pending';
    if (answer.final_score !== null) return 'scored';
    return 'submitted';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scored':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'submitted':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scored':
        return 'Sudah Dinilai';
      case 'submitted':
      case 'pending':
        return 'Menunggu Penilaian';
      default:
        return 'Belum Dijawab';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scored':
        return 'default' as const;
      case 'submitted':
      case 'pending':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  // Group questions by category
  const questionsByCategory = questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Belum ada soal ujian yang tersedia</p>
          <p className="text-sm text-gray-400 mt-2">
            Silakan tunggu dosen menambahkan soal ujian
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Soal Ujian Riset Operasi 2</h2>
        <Badge variant="outline">{questions.length} Soal</Badge>
      </div>

      {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            {category}
          </h3>
          
          <div className="grid gap-4">
            {categoryQuestions.map((question) => {
              const status = getQuestionStatus(question.id);
              const canAnswer = status === 'not_answered';
              const score = progressReport?.answers.find(a => a.question_id === question.id)?.final_score;
              
              return (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>{question.title}</span>
                          {getStatusIcon(status)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Skor maksimal: {question.max_score} poin
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant={getStatusVariant(status)}>
                          {getStatusText(status)}
                        </Badge>
                        {score !== null && score !== undefined && (
                          <Badge variant="secondary">
                            Nilai: {score}/{question.max_score}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {question.content.length > 150 
                        ? `${question.content.substring(0, 150)}...`
                        : question.content
                      }
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Dibuat: {question.created_at.toLocaleDateString('id-ID')}
                      </div>
                      
                      <Button 
                        size="sm"
                        onClick={() => onQuestionSelect(question)}
                        disabled={!canAnswer}
                        variant={canAnswer ? "default" : "outline"}
                      >
                        {canAnswer ? 'Kerjakan Soal' : 'Lihat Soal'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
