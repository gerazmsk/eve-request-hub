import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES } from '@/types';
import { ClientNav } from '@/components/ClientNav';
import { useState } from 'react';

export default function ClientHome() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-6 space-y-6">
        <div className="animate-fade-in">
          <p className="text-muted-foreground text-sm">Welcome back</p>
          <h1 className="font-display text-2xl font-bold">
            Hello {profile?.first_name || 'there'} 👋
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl h-11" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Event Services</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filtered.map(cat => (
              <button
                key={cat.key}
                onClick={() => navigate(`/client/category/${cat.key}`)}
                className="flex flex-col items-center gap-2 rounded-xl bg-card border p-4 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <ClientNav />
    </div>
  );
}
