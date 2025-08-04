
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import type { ScoreSummary } from '../../../server/src/schema';

interface StudentScoresProps {
  studentsSummary: ScoreSummary[];
}

export function StudentScores({ studentsSummary }: StudentScoresProps) {
  // Calculate class statistics
  const totalStudents = studentsSummary.length;
  const averageScore = totalStudents > 0 
    ? studentsSummary.reduce((sum, student) => sum + student.percentage, 0) / totalStudents 
    : 0;
  const highestScore = Math.max(...studentsSummary.map(s => s.percentage), 0);
  const lowestScore = Math.min(...studentsSummary.map(s => s.percentage), 0);

  // Sort students by percentage (highest first)
  const sortedStudents = [...studentsSummary].sort((a, b) => b.percentage - a.percentage);

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 80) return { variant: 'default' as const, label: 'Baik Sekali' };
    if (percentage >= 60) return { variant: 'secondary' as const, label: 'Baik' };
    if (percentage >= 40) return { variant: 'outline' as const, label: 'Cukup' };
    return { variant: 'destructive' as const, label: 'Perlu Perbaikan' };
  };

  if (studentsSummary.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Belum ada data nilai mahasiswa</p>
          <p className="text-sm text-gray-400 mt-2">
            Data akan muncul setelah mahasiswa mulai mengerjakan soal
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Statistik Kelas</span>
          </CardTitle>
          <CardDescription>
            Ringkasan performa keseluruhan mahasiswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{totalStudents}</span>
              </div>
              <p className="text-sm text-gray-600">Total Mahasiswa</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{averageScore.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-gray-600">Rata-rata Kelas</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Trophy className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">{highestScore.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-gray-600">Nilai Tertinggi</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">{lowestScore.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-gray-600">Nilai Terendah</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Nilai Mahasiswa</CardTitle>
          <CardDescription>
            Nilai individu dan progress setiap mahasiswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedStudents.map((student, index) => {
              const performanceBadge = getPerformanceBadge(student.percentage);
              
              return (
                <div key={student.student_id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-lg">{student.student_name}</h4>
                          <p className="text-sm text-gray-600">NIM: {student.nim}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant={performanceBadge.variant}>
                        {performanceBadge.label}
                      </Badge>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getPerformanceColor(student.percentage)}`}>
                          {student.percentage.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {student.total_score}/{student.max_possible_score} poin
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-lg font-bold">{student.total_questions}</p>
                      <p className="text-xs text-gray-600">Total Soal</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">{student.answered_questions}</p>
                      <p className="text-xs text-gray-600">Sudah Dijawab</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-lg font-bold text-blue-600">
                        {((student.answered_questions / student.total_questions) * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-600">Progress</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Progress Ujian</span>
                      <span className="text-sm text-gray-600">
                        {student.answered_questions}/{student.total_questions}
                      </span>
                    </div>
                    <Progress 
                      value={(student.answered_questions / student.total_questions) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Category scores */}
                  {student.category_scores.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Nilai per Kategori:</h5>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {student.category_scores.map((category) => (
                          <div key={category.category} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                            <span className="font-medium truncate flex-1 mr-2">
                              {category.category.replace('Pertemuan', 'P').replace('PERTEMUAN', 'P')}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className={getPerformanceColor(category.percentage)}>
                                {category.score}/{category.max_score}
                              </span>
                              <span className="text-gray-500">
                                ({category.percentage.toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
