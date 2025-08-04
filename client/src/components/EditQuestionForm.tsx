
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, ArrowLeft } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Question, QuestionCategory } from '../../../server/src/schema';

interface EditQuestionFormProps {
  question: Question;
  onQuestionUpdated: () => void;
  onCancel: () => void;
}

const categories: QuestionCategory[] = [
  'Pertemuan 1-Pemikiran Sistem',
  'PERTEMUAN 2- ANALISIS JARINGAN',
  'Pertemuan 3-Parameter Analisis Jaringan',
  'Pertemuan 4-Analisis Jaringan Pada Manajemen Proyek',
  'Pertemuan 5- Simulasi Monte Carlo',
  'Game Theory 2xN',
  'Game Theory MxN'
];

export function EditQuestionForm({ question, onQuestionUpdated, onCancel }: EditQuestionFormProps) {
  const [formData, setFormData] = useState({
    title: question.title,
    content: question.content,
    category: question.category || 'Pertemuan 1-Pemikiran Sistem' as QuestionCategory,
    max_score: question.max_score,
    keywords: question.keywords || [],
    answer_pattern: question.answer_pattern || ''
  });
  
  const [newKeyword, setNewKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keywordToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Judul dan konten soal tidak boleh kosong');
      return;
    }

    if (formData.max_score <= 0) {
      alert('Skor maksimal harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await trpc.updateQuestion.mutate({
        id: question.id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        max_score: formData.max_score,
        keywords: formData.keywords.length > 0 ? formData.keywords : null,
        answer_pattern: formData.answer_pattern.trim() || null
      });
      
      alert('Soal berhasil diperbarui! ✅');
      onQuestionUpdated();
    } catch (error) {
      console.error('Failed to update question:', error);
      alert('Gagal memperbarui soal. Silakan coba lagi.');
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
            <CardTitle>Edit Soal</CardTitle>
            <CardDescription>
              Perbarui informasi soal ujian
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Soal *</Label>
              <Input
                id="title"
                placeholder="Masukkan judul soal"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: QuestionCategory) => 
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori soal" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Konten Soal *</Label>
            <Textarea
              id="content"
              placeholder="Tuliskan soal dengan lengkap dan jelas..."
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={8}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_score">Skor Maksimal *</Label>
            <Input
              id="max_score"
              type="number"
              min={1}
              max={100}
              value={formData.max_score}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setFormData((prev) => ({ ...prev, max_score: parseInt(e.target.value) || 1 }))
              }
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label>Kata Kunci untuk Penilaian Otomatis (Opsional)</Label>
              <p className="text-sm text-gray-600 mb-2">
                Kata kunci yang akan digunakan untuk penilaian otomatis
              </p>
              <div className="flex space-x-2">
                <Input
                  placeholder="Masukkan kata kunci"
                  value={newKeyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  disabled={isSubmitting}
                />
                <Button 
                  type="button" 
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim() || isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{keyword}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-1"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer_pattern">Pola Jawaban (Opsional)</Label>
            <Textarea
              id="answer_pattern"
              placeholder="Deskripsi pola atau struktur jawaban yang diharapkan..."
              value={formData.answer_pattern}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setFormData((prev) => ({ ...prev, answer_pattern: e.target.value }))
              }
              rows={4}
              disabled={isSubmitting}
            />
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
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
