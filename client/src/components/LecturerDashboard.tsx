
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Users, BarChart3, FileCheck, Sparkles } from 'lucide-react';
import { QuestionManagement } from '@/components/QuestionManagement';
import { CreateQuestionForm } from '@/components/CreateQuestionForm';
import { StudentScores } from '@/components/StudentScores'; 
import { AnswerGrading } from '@/components/AnswerGrading';
import type { User, Question, ScoreSummary } from '../../../server/src/schema';

interface LecturerDashboardProps {
  user: User;
}

export function LecturerDashboard({ user }: LecturerDashboardProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentsSummary, setStudentsSummary] = useState<ScoreSummary[]>([]);
  const [activeTab, setActiveTab] = useState('questions');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadQuestions = useCallback(async () => {
    try {
      const result = await trpc.getQuestions.query();
      setQuestions(result);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  }, []);

  const loadStudentsSummary = useCallback(async () => {
    try {
      const result = await trpc.getAllStudentsSummary.query();
      setStudentsSummary(result);
    } catch (error) {
      console.error('Failed to load students summary:', error);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
    loadStudentsSummary();
  }, [loadQuestions, loadStudentsSummary]);

  const handleQuestionCreated = useCallback(() => {
    loadQuestions();
    setShowCreateForm(false);
  }, [loadQuestions]);

  const handleQuestionUpdated = useCallback(() => {
    loadQuestions();
  }, [loadQuestions]);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Dashboard Dosen 👨‍🏫</CardTitle>
          <CardDescription className="text-purple-100">
            Selamat datang, {user.name}! Kelola soal ujian dan nilai mahasiswa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span className="text-sm">Total Soal</span>
              </div>
              <p className="text-2xl font-bold mt-1">{questions.length}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">Mahasiswa Terdaftar</span>
              </div>
              <p className="text-2xl font-bold mt-1">{studentsSummary.length}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5" />
                <span className="text-sm">Perlu Dinilai</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {/* This would need actual data from pending answers */}
                0
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="questions" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Kelola Soal</span>
          </TabsTrigger>
          <TabsTrigger value="grading" className="flex items-center space-x-2">
            <FileCheck className="h-4 w-4" />
            <span>Nilai Jawaban</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Nilai Mahasiswa</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analitik</span>
          </TabsTrigger>
          <TabsTrigger value="ai-tools" className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>AI Tools</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manajemen Soal</h2>
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Buat Soal Baru</span>
            </Button>
          </div>

          {showCreateForm ? (
            <CreateQuestionForm 
              createdBy={user.id}
              onQuestionCreated={handleQuestionCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : (
            <QuestionManagement 
              questions={questions}
              onQuestionUpdated={handleQuestionUpdated}
            />
          )}
        </TabsContent>

        <TabsContent value="grading">
          <AnswerGrading lecturerId={user.id} />
        </TabsContent>

        <TabsContent value="students">
          <StudentScores studentsSummary={studentsSummary} />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analitik Ujian</CardTitle>
              <CardDescription>
                Statistik dan analisis kinerja mahasiswa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Fitur analitik akan segera hadir</p>
                <p className="text-sm text-gray-400 mt-2">
                  Akan menampilkan statistik performa mahasiswa, distribusi nilai, dan tren jawaban
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-tools">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Integrasi Alat AI</span>
              </CardTitle>
              <CardDescription>
                Tempat untuk mengintegrasikan layanan AI eksternal untuk penilaian esai otomatis, generasi feedback, atau analisis data tingkat lanjut.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Dengan integrasi AI, Anda dapat memanfaatkan teknologi canggih untuk meningkatkan efisiensi penilaian dan memberikan feedback yang lebih komprehensif kepada mahasiswa. Fitur-fitur yang dapat diintegrasikan meliputi penilaian esai otomatis berbasis NLP, analisis sentimen jawaban, generasi feedback personalisasi, dan deteksi plagiarisme tingkat lanjut.
                </p>
                <Button className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Konfigurasi Layanan AI</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
