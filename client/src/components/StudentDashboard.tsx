
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, FileText, BarChart3, Trophy } from 'lucide-react';
import { QuestionList } from '@/components/QuestionList';
import { AnswerForm } from '@/components/AnswerForm';
import { ProgressReport } from '@/components/ProgressReport';
import type { User, Question, ScoreSummary, ProgressReport as ProgressReportType } from '../../../server/src/schema';

interface StudentDashboardProps {
  user: User;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [scoreSummary, setScoreSummary] = useState<ScoreSummary | null>(null);
  const [progressReport, setProgressReport] = useState<ProgressReportType | null>(null);
  const [activeTab, setActiveTab] = useState('questions');

  const loadQuestions = useCallback(async () => {
    try {
      const result = await trpc.getQuestions.query();
      setQuestions(result);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  }, []);

  const loadScoreSummary = useCallback(async () => {
    try {
      const result = await trpc.getScoreSummary.query({ studentId: user.id });
      setScoreSummary(result);
    } catch (error) {
      console.error('Failed to load score summary:', error);
    }
  }, [user.id]);

  const loadProgressReport = useCallback(async () => {
    try {
      const result = await trpc.getProgressReport.query({ studentId: user.id });
      setProgressReport(result);
    } catch (error) {
      console.error('Failed to load progress report:', error);
    }
  }, [user.id]);

  useEffect(() => {
    loadQuestions();
    loadScoreSummary();
    loadProgressReport();
  }, [loadQuestions, loadScoreSummary, loadProgressReport]);

  const handleAnswerSubmitted = useCallback(() => {
    loadScoreSummary();
    loadProgressReport();
    setSelectedQuestion(null);
    setActiveTab('progress');
  }, [loadScoreSummary, loadProgressReport]);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Selamat Datang, {user.name}! 👋</CardTitle>
          <CardDescription className="text-blue-100">
            NIM: {user.nim} • Nomor Absen: {user.attendance_number}
          </CardDescription>
        </CardHeader>
        {scoreSummary && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">Soal Dijawab</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {scoreSummary.answered_questions}/{scoreSummary.total_questions}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm">Total Skor</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {scoreSummary.total_score}/{scoreSummary.max_possible_score}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-sm">Persentase</span>
                </div>
                <p className="text-2xl font-bold mt-1">{scoreSummary.percentage.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questions" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Soal Ujian</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Progress</span>
          </TabsTrigger>
          <TabsTrigger value="scores" className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>Nilai</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-6">
          {selectedQuestion ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedQuestion.title}</CardTitle>
                    <Badge variant="secondary">{selectedQuestion.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none mb-6">
                    <p className="whitespace-pre-wrap">{selectedQuestion.content}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>Skor Maksimal: {selectedQuestion.max_score}</span>
                  </div>
                </CardContent>
              </Card>
              
              <AnswerForm 
                question={selectedQuestion}
                studentId={user.id}
                onAnswerSubmitted={handleAnswerSubmitted}
                onCancel={() => setSelectedQuestion(null)}
              />
            </div>
          ) : (
            <QuestionList 
              questions={questions}
              onQuestionSelect={setSelectedQuestion}
              progressReport={progressReport}
            />
          )}
        </TabsContent>

        <TabsContent value="progress">
          {progressReport ? (
            <ProgressReport report={progressReport} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Memuat data progress...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scores">
          {scoreSummary ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>Ringkasan Nilai</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{scoreSummary.total_questions}</p>
                      <p className="text-sm text-gray-600">Total Soal</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{scoreSummary.answered_questions}</p>
                      <p className="text-sm text-gray-600">Sudah Dijawab</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {scoreSummary.total_score}/{scoreSummary.max_possible_score}
                      </p>
                      <p className="text-sm text-gray-600">Total Skor</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{scoreSummary.percentage.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Persentase</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress Keseluruhan</span>
                      <span className="text-sm text-gray-600">{scoreSummary.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={scoreSummary.percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Nilai Per Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scoreSummary.category_scores.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{category.category}</span>
                          <span className="text-sm text-gray-600">
                            {category.score}/{category.max_score} ({category.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={category.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Memuat data nilai...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
