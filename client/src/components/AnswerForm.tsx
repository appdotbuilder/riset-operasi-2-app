
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Question } from '../../../server/src/schema';

interface AnswerFormProps {
  question: Question;
  studentId: number;
  onAnswerSubmitted: () => void;
  onCancel: () => void;
}

export function AnswerForm({ question, studentId, onAnswerSubmitted, onCancel }: AnswerFormProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      alert('Mohon isi jawaban Anda');
      return;
    }

    if (answer.trim().length < 10) {
      alert('Jawaban minimal 10 karakter');
      return;
    }

    setIsSubmitting(true);
    try {
      await trpc.submitAnswer.mutate({
        question_id: question.id,
        student_id: studentId,
        content: answer.trim()
      });
      
      alert('Jawaban berhasil dikirim! 🎉');
      onAnswerSubmitted();
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Gagal mengirim jawaban. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <CardTitle>Kerjakan Soal</CardTitle>
            <CardDescription>
              Tuliskan jawaban Anda dengan lengkap dan jelas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="answer">Jawaban Anda</Label>
            <Textarea
              id="answer"
              placeholder="Tuliskan jawaban yang lengkap dan terstruktur..."
              value={answer}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
              rows={12}
              className="resize-none"
              disabled={isSubmitting}
              required
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Minimal 10 karakter</span>
              <span>{answer.length} karakter</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">💡 Tips Menjawab:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Jawab dengan lengkap dan terstruktur</li>
              <li>• Gunakan istilah-istilah yang tepat sesuai materi</li>
              <li>• Berikan penjelasan langkah demi langkah jika diperlukan</li>
              <li>• Periksa kembali jawaban sebelum mengirim</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || answer.trim().length < 10}
              className="flex-1"
            >
              {isSubmitting ? (
                'Mengirim...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Jawaban
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
