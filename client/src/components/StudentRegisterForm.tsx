
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StudentRegisterFormProps {
  onRegister: (data: {
    name: string;
    nim: string;
    attendance_number: number;
    password: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function StudentRegisterForm({ onRegister, isLoading }: StudentRegisterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    nim: '',
    attendance_number: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.nim.trim() || !formData.attendance_number.trim() || !formData.password.trim()) {
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

    const attendanceNum = parseInt(formData.attendance_number);
    if (isNaN(attendanceNum) || attendanceNum <= 0) {
      alert('Nomor absen harus berupa angka positif');
      return;
    }

    await onRegister({
      name: formData.name.trim(),
      nim: formData.nim.trim(),
      attendance_number: attendanceNum,
      password: formData.password
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input
          id="name"
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
        <Label htmlFor="nim">NIM</Label>
        <Input
          id="nim"
          type="text"
          placeholder="Masukkan NIM"
          value={formData.nim}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            setFormData((prev) => ({ ...prev, nim: e.target.value }))
          }
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attendance_number">Nomor Absen</Label>
        <Input
          id="attendance_number"
          type="number"
          placeholder="Masukkan nomor absen"
          value={formData.attendance_number}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            setFormData((prev) => ({ ...prev, attendance_number: e.target.value }))
          }
          min="1"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
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
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <Input
          id="confirmPassword"
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
        {isLoading ? 'Mendaftar...' : 'Daftar Sebagai Mahasiswa'}
      </Button>
    </form>
  );
}
