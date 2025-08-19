import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export const NewsBoard = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('id, title, content, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching news:', error);
      } else {
        setNews(data || []);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Noticias y Anuncios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <div className="p-4 rounded-lg bg-muted/50">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </>
        ) : news.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay noticias disponibles en este momento.</p>
          </div>
        ) : (
          news.map((item) => (
            <div key={item.id} className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-foreground/80 mb-2 whitespace-pre-wrap">{item.content}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleString('es-ES')}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};