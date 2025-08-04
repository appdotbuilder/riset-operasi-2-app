
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import type { ProgressReport as ProgressReportType } from '../../../server/src/schema';

interface ProgressReportProps {
  report: ProgressReportType;
}

export function ProgressReport({ report }: ProgressReportProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'auto_scored':
      case 'manually_scored':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'auto_scored':
        return 'Dinilai Otomatis';
      case 'manually_scored':
        return 'Dinilai Manual';
      case 'pending':
        return 'Menunggu Penilaian';
      default:
        return 'Belum Dinilai';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'auto_scored':
      case 'manually_scored':
        return 'default' as const;
      case 'pending':
        return 'secondary' as const;
      default:
        return 'destructive' as const;
    }
  };

  // Group answers by category
  const answersByCategory = report.answers.reduce((acc, answer) => {
    if (!acc[answer.category]) {
      acc[answer.category] = [];
    }
    acc[answer.category].push(answer);
    return acc;
  }, {} as Record<string, typeof report.answers>);

  // Calculate progress
  const totalAnswers = report.answers.length;
  const scoredAnswers = report.answers.filter(a => a.final_score !== null).length;
  const progressPercentage = totalAnswers > 0 ? (scoredAnswers / totalAnswers) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Progress Ujian</span>
          </CardTitle>
          <CardDescription>
            Ringkasan jawaban dan status penilaian Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{totalAnswers}</p>
              <p className="text-sm text-gray-600">Total Jawaban</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{scoredAnswers}</p>
              <p className="text-sm text-gray-600">Sudah Dinilai</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{totalAnswers - scoredAnswers}</p>
              <p className="text-sm text-gray-600">Menunggu Nilai</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress Penilaian</span>
              <span className="text-sm text-gray-600">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Answers by Category */}
      {Object.entries(answersByCategory).map(([category, answers]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
            <CardDescription>
              {answers.length} jawaban dalam kategori ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {answers.map((answer) => (
                <div key={answer.question_id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{answer.question_title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Dijawab: {answer.submitted_at.toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant={getStatusVariant(answer.status)} className="flex items-center space-x-1">
                        {getStatusIcon(answer.status)}
                        <span>{getStatusText(answer.status)}</span>
                      </Badge>
                      {answer.final_score !== null && (
                        <Badge variant="outline">
                          {answer.final_score}/{answer.max_score} poin
                        </Badge>
                      )}
                    </div>
                  </div>

                  {answer.final_score !== null && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Nilai</span>
                        <span className="text-sm text-gray-600">
                          {((answer.final_score / answer.max_score) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={(answer.final_score / answer.max_score) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
