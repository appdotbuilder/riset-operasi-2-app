
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileCheck, Clock, CheckCircle, User, BookOpen } from 'lucide-react';
import type { AnswerStatus, QuestionCategory } from '../../../server/src/schema';

interface AnswerGradingProps {
  lecturerId: number;
}

// Define proper types for the answer with extended fields
interface AnswerForGrading {
  id: number;
  question_id: number;
  student_id: number;
  content: string;
  auto_score: number | null;
  manual_score: number | null;
  final_score: number | null;
  status: AnswerStatus;
  feedback: string | null;
  submitted_at: Date;
  scored_at: Date | null;
  scored_by: number | null;
  question: {
    id: number;
    title: string;
    max_score: number;
    category: QuestionCategory;
  };
  student: {
    id: number;
    name: string;
    nim: string;
  };
}

// Sample data for demonstration - in real implementation, this would come from API
const sampleAnswers: AnswerForGrading[] = [
  {
    id: 1,
    question_id: 1,
    student_id: 1,
    content: "Pemikiran sistem adalah pendekatan holistik untuk memecahkan masalah kompleks dengan mempertimbangkan interaksi antar komponen. Dalam riset operasi, pendekatan ini membantu mengidentifikasi solusi optimal dengan memahami sistem secara keseluruhan, bukan hanya bagian-bagiannya.",
    auto_score: null,
    manual_score: null,
    final_score: null,
    status: 'pending',
    feedback: null,
    submitted_at: new Date('2024-01-15T10:30:00'),
    scored_at: null,
    scored_by: null,
    question: {
      id: 1,
      title: "Jelaskan konsep pemikiran sistem dalam riset operasi",
      max_score: 20,
      category: 'Pertemuan 1-Pemikiran Sistem'
    },
    student: {
      id: 1,
      name: "Ahmad Fadli",
      nim: "12345678"
    }
  },
  {
    id: 2,
    question_id: 2,
    student_id: 2,
    content: "Analisis jaringan merupakan metode untuk menganalisis proyek yang kompleks dengan menggunakan diagram jaringan. Komponen utamanya meliputi: 1) Node sebagai titik kejadian, 2) Arrow sebagai aktivitas, 3) Jalur kritis yang menentukan durasi minimum proyek.",
    auto_score: 15,
    manual_score: null,
    final_score: null,
    status: 'auto_scored',
    feedback: null,
    submitted_at: new Date('2024-01-15T11:15:00'),
    scored_at: new Date('2024-01-15T11:16:00'),
    scored_by: null,
    question: {
      id: 2,
      title: "Uraikan komponen utama dalam analisis jaringan",
      max_score: 25,
      category: 'PERTEMUAN 2- ANALISIS JARINGAN'
    },
    student: {
      id: 2,
      name: "Siti Rahma",
      nim: "12345679"
    }
  }
];

export function AnswerGrading({ lecturerId }: AnswerGradingProps) {
  const [answers, setAnswers] = useState<AnswerForGrading[]>(sampleAnswers);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerForGrading | null>(null);
  const [gradeForm, setGradeForm] = useState({
    manual_score: 0,
    feedback: ''
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In real implementation, this would fetch from API
  const loadAnswers = useCallback(async () => {
    try {
      // const result = await trpc.getAnswersForGrading.query();
      // setAnswers(result);
      console.log('Loading answers for grading...');
    } catch (error) {
      console.error('Failed to load answers:', error);
    }
  }, []);

  useEffect(() => {
    loadAnswers();
  }, [loadAnswers]);

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAnswer) return;
    
    if (gradeForm.manual_score < 0 || gradeForm.manual_score > selectedAnswer.question.max_score) {
      alert(`Nilai harus antara 0 dan ${selectedAnswer.question.max_score}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await trpc.manualScoreAnswer.mutate({
        answer_id: selectedAnswer.id,
        manual_score: gradeForm.manual_score,
        feedback: gradeForm.feedback.trim() || undefined,
        scored_by: lecturerId
      });
      
      // Update local state with proper typing
      setAnswers((prev: AnswerForGrading[]) => 
        prev.map((answer: AnswerForGrading) => 
          answer.id === selectedAnswer.id 
            ? {
                ...answer,
                manual_score: gradeForm.manual_score,
                final_score: gradeForm.manual_score,
                status: 'manually_scored' as const,
                feedback: gradeForm.feedback.trim() || null,
                scored_at: new Date(),
                scored_by: lecturerId
              }
            : answer
        )
      );
      
      alert('Nilai berhasil diberikan! ✅');
      setSelectedAnswer(null);
      setGradeForm({ manual_score: 0, feedback: '' });
    } catch (error) {
      console.error('Failed to grade answer:', error);
      alert('Gagal memberikan nilai. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAnswers = answers.filter((answer: AnswerForGrading) => {
    if (filterStatus === 'all') return true;
    return answer.status === filterStatus;
  });

  const pendingCount = answers.filter((a: AnswerForGrading) => a.status === 'pending').length;
  const autoScoredCount = answers.filter((a: AnswerForGrading) => a.status === 'auto_scored').length;
  const manuallyScoredCount = answers.filter((a: AnswerForGrading) => a.status === 'manually_scored').length;

  if (selectedAnswer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setSelectedAnswer(null)}>
            ← Kembali ke Daftar
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Nilai Jawaban</h2>
            <p className="text-gray-600">
              {selectedAnswer.student.name} - {selectedAnswer.question.title}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question and Answer */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Soal</CardTitle>
                <Badge variant="secondary">{selectedAnswer.question.category}</Badge>
              </CardHeader>
              <CardContent>
                <h3 className="font-medium mb-2">{selectedAnswer.question.title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Skor maksimal: {selectedAnswer.question.max_score} poin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Jawaban Mahasiswa</span>
                </CardTitle>
                <CardDescription>
                  {selectedAnswer.student.name} ({selectedAnswer.student.nim}) • 
                  Dikumpulkan: {selectedAnswer.submitted_at.toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedAnswer.content}</p>
                </div>
                
                {selectedAnswer.auto_score !== null && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Nilai Otomatis</span>
                    </div>
                    <p className="text-blue-700 mt-1">
                      {selectedAnswer.auto_score}/{selectedAnswer.question.max_score} poin
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Grading Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Berikan Nilai</CardTitle>
              <CardDescription>
                Nilai manual akan menggantikan nilai otomatis (jika ada)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual_score">
                    Nilai Manual (0 - {selectedAnswer.question.max_score})
                  </Label>
                  <Input
                    id="manual_score"
                    type="number"
                    min={0}
                    max={selectedAnswer.question.max_score}
                    value={gradeForm.manual_score}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setGradeForm((prev) => ({ 
                        ...prev, 
                        manual_score: parseInt(e.target.value) || 0 
                      }))
                    }
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-gray-600">
                    Persentase: {((gradeForm.manual_score / selectedAnswer.question.max_score) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback (Opsional)</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Berikan feedback untuk mahasiswa..."
                    value={gradeForm.feedback}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setGradeForm((prev) => ({ ...prev, feedback: e.target.value }))
                    }
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Nilai'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5" />
            <span>Penilaian Jawaban</span>
          </CardTitle>
          <CardDescription>
            Kelola dan berikan nilai untuk jawaban mahasiswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">{pendingCount}</span>
              </div>
              <p className="text-sm text-gray-600">Menunggu Penilaian</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{autoScoredCount}</span>
              </div>
              <p className="text-sm text-gray-600">Dinilai Otomatis</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{manuallyScoredCount}</span>
              </div>
              <p className="text-sm text-gray-600">Dinilai Manual</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <BookOpen className="h-5 w-5 text-gray-600" />
                <span className="text-2xl font-bold text-gray-600">{answers.length}</span>
              </div>
              <p className="text-sm text-gray-600">Total Jawaban</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <Label>Filter Status:</Label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu Penilaian</SelectItem>
            <SelectItem value="auto_scored">Dinilai Otomatis</SelectItem>
            <SelectItem value="manually_scored">Dinilai Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Answers List */}
      <div className="space-y-4">
        {filteredAnswers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {filterStatus === 'all' 
                  ? 'Belum ada jawaban yang perlu dinilai'
                  : 'Tidak ada jawaban dengan status ini'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnswers.map((answer: AnswerForGrading) => (
            <Card key={answer.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{answer.question.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {answer.student.name} ({answer.student.nim}) • 
                      {answer.question.category}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge 
                      variant={
                        answer.status === 'pending' ? 'secondary' :
                        answer.status === 'auto_scored' ? 'outline' :
                        'default'
                      }
                    >
                      {answer.status === 'pending' && 'Menunggu Penilaian'}
                      {answer.status === 'auto_scored' && 'Dinilai Otomatis'}
                      {answer.status === 'manually_scored' && 'Dinilai Manual'}
                    </Badge>
                    {answer.final_score !== null && (
                      <Badge variant="outline">
                        {answer.final_score}/{answer.question.max_score} poin
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {answer.content.length > 200 
                    ? `${answer.content.substring(0, 200)}...`
                    : answer.content
                  }
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Dikumpulkan: {answer.submitted_at.toLocaleDateString('id-ID')}
                    {answer.scored_at && (
                      <> • Dinilai: {answer.scored_at.toLocaleDateString('id-ID')}</>
                    )}
                  </div>
                  
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedAnswer(answer);
                      setGradeForm({
                        manual_score: answer.manual_score || answer.auto_score || 0,
                        feedback: answer.feedback || ''
                      });
                    }}
                  >
                    {answer.status === 'manually_scored' ? 'Edit Nilai' : 'Beri Nilai'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
