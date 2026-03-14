import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { setToken } from '@/lib/auth';

interface AuthDialogProps {
  open: boolean;
  onSuccess: (username: string) => void;
  onGuestPlay: () => void;
}

export default function AuthDialog({ open, onSuccess, onGuestPlay }: AuthDialogProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setUsername(''); setPassword(''); setError(''); };

  const handleSubmit = async () => {
    if (!username || !password) { setError('Please enter username and password'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/auth/${tab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      setToken(data.token);
      reset();
      onSuccess(username);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to Treasure Hunt!</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => { setTab(v as 'signin' | 'signup'); reset(); }}>
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="space-y-3 mt-4">
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
          </TabsContent>
          <TabsContent value="signup" className="space-y-3 mt-4">
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
          </TabsContent>
        </Tabs>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
          {loading ? 'Please wait...' : tab === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>
        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
        </div>
        <Button variant="outline" onClick={onGuestPlay} className="w-full">Play as Guest</Button>
      </DialogContent>
    </Dialog>
  );
}
