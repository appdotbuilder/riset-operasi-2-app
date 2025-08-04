
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Eye, BookOpen } from 'lucide-react';
import { EditQuestionForm } from '@/components/EditQuestionForm';
import type { Question } from '../../../server/src/schema';

interface QuestionManagementProps {
  questions: Question[];
  onQuestionUpdated: () => void;
}

export function QuestionManagement({ questions, onQuestionUpdated }: QuestionManagementProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Group questions by category
  const questionsByCategory = questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  const handleEditComplete = () => {
    setEditingQuestion(null);
    onQuestionUpdated();
  };

  if (editingQuestion) {
    return (
      <EditQuestionForm 
        question={editingQuestion}
        onQuestionUpdated={handleEditComplete}
        onCancel={() => setEditingQuestion(null)}
      />
    );
  }

  if (selectedQuestion) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setSelectedQuestion(null)}>
            ← Kembali
          </Button>
          <h2 className="text-xl font-semibold">Detail Soal</h2>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedQuestion.title}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedQuestion.category}</Badge>
                <Button 
                  size="sm" 
                  onClick={() => setEditingQuestion(selectedQuestion)}
                  className="flex items-center space-x-1"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
              </div>
            </div>
            <CardDescription>
              Skor maksimal: {selectedQuestion.max_score} • 
              Dibuat: {selectedQuestion.created_at.toLocaleDateString('id-ID')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Konten Soal:</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedQuestion.content}</p>
                </div>
              </div>

              {selectedQuestion.keywords && selectedQuestion.keywords.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Kata Kunci (untuk penilaian otomatis):</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestion.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedQuestion.answer_pattern && (
                <div>
                  <h4 className="font-medium mb-2">Pola Jawaban:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedQuestion.answer_pattern}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Belum ada soal yang dibuat</p>
          <p className="text-sm text-gray-400 mt-2">
            Klik tombol "Buat Soal Baru" untuk menambahkan soal pertama
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Daftar Soal</h2>
        <Badge variant="outline">{questions.length} Soal Total</Badge>
      </div>

      {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            {category} ({categoryQuestions.length} soal)
          </h3>
          
          <div className="grid gap-4">
            {categoryQuestions.map((question) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{question.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Skor maksimal: {question.max_score} poin • 
                        Dibuat: {question.created_at.toLocaleDateString('id-ID')}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{question.category}</Badge>
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
                    <div className="flex items-center space-x-2">
                      {question.keywords && question.keywords.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Auto-scoring aktif
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedQuestion(question)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setEditingQuestion(question)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
