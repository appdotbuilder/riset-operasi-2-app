
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
  onLogin: (identifier: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export function LoginForm({ onLogin, isLoading }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      alert('Mohon lengkapi semua field');
      return;
    }
    await onLogin(identifier.trim(), password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier">NIM (Mahasiswa) / Nama (Dosen)</Label>
        <Input
          id="identifier"
          type="text"
          placeholder="Masukkan NIM atau nama"
          value={identifier}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Masukkan password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Masuk...' : 'Masuk'}
      </Button>
    </form>
  );
}
