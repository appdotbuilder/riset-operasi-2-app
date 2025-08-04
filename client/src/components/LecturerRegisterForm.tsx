
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LecturerRegisterFormProps {
  onRegister: (data: {
    name: string;
    password: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function LecturerRegisterForm({ onRegister, isLoading }: LecturerRegisterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.password.trim()) {
      alert('Mohon lengkapi semua field');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    await onRegister({
      name: formData.name.trim(),
      password: formData.password
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lecturer_name">Nama Dosen</Label>
        <Input
          id="lecturer_name"
          type="text"
          placeholder="Masukkan nama lengkap"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lecturer_password">Password</Label>
        <Input
          id="lecturer_password"
          type="password"
          placeholder="Minimal 6 karakter"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          minLength={6}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lecturer_confirm_password">Konfirmasi Password</Label>
        <Input
          id="lecturer_confirm_password"
          type="password"
          placeholder="Ulangi password"
          value={formData.confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
          }
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Mendaftar...' : 'Daftar Sebagai Dosen'}
      </Button>
    </form>
  );
}
