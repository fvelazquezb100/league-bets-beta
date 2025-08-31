import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Edit2, Eye, EyeOff, Snowflake } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
  is_active: boolean;
  is_frozen: boolean;
}

export const NewsManagement = () => {
  const { toast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('is_frozen', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching news:', error);
        toast({ title: 'Error', description: 'No se pudieron cargar las noticias', variant: 'destructive' });
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

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingNews(null);
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Error', description: 'El título y contenido son obligatorios', variant: 'destructive' });
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({ title: 'Error', description: 'Usuario no autenticado', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('news')
        .insert({
          title: title.trim(),
          content: content.trim(),
          created_by: user.id,
          is_active: true
        });

      if (error) throw error;

      toast({ title: 'Éxito', description: 'Noticia creada correctamente' });
      resetForm();
      fetchNews();
    } catch (error: any) {
      console.error('Error creating news:', error);
      toast({ title: 'Error', description: error.message || 'No se pudo crear la noticia', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (newsItem: NewsItem) => {
    setEditingNews(newsItem);
    setTitle(newsItem.title);
    setContent(newsItem.content);
  };

  const handleUpdate = async () => {
    if (!editingNews || !title.trim() || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('news')
        .update({
          title: title.trim(),
          content: content.trim()
        })
        .eq('id', editingNews.id);

      if (error) throw error;

      toast({ title: 'Éxito', description: 'Noticia actualizada correctamente' });
      resetForm();
      fetchNews();
    } catch (error: any) {
      console.error('Error updating news:', error);
      toast({ title: 'Error', description: error.message || 'No se pudo actualizar la noticia', variant: 'destructive' });
    }
  };

  const handleToggleFreeze = async (newsId: number, currentFrozen: boolean) => {
    try {
      const { error } = await supabase
        .from('news')
        .update({ is_frozen: !currentFrozen })
        .eq('id', newsId);

      if (error) throw error;

      toast({ 
        title: 'Éxito', 
        description: `Noticia ${!currentFrozen ? 'congelada' : 'descongelada'} correctamente` 
      });
      fetchNews();
    } catch (error: any) {
      console.error('Error toggling freeze status:', error);
      toast({ title: 'Error', description: error.message || 'No se pudo cambiar el estado de congelado', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (newsId: number, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('news')
        .update({ is_active: !currentActive })
        .eq('id', newsId);

      if (error) throw error;

      toast({ 
        title: 'Éxito', 
        description: `Noticia ${!currentActive ? 'activada' : 'desactivada'} correctamente` 
      });
      fetchNews();
    } catch (error: any) {
      console.error('Error toggling news status:', error);
      toast({ title: 'Error', description: error.message || 'No se pudo cambiar el estado', variant: 'destructive' });
    }
  };

  const handleDelete = async (newsId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta noticia?')) return;

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', newsId);

      if (error) throw error;

      toast({ title: 'Éxito', description: 'Noticia eliminada correctamente' });
      fetchNews();
    } catch (error: any) {
      console.error('Error deleting news:', error);
      toast({ title: 'Error', description: error.message || 'No se pudo eliminar la noticia', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Noticias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create/Edit Form */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">{editingNews ? 'Editar Noticia' : 'Crear Nueva Noticia'}</h3>
          
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la noticia"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Contenido de la noticia"
              rows={4}
            />
          </div>
          
          <div className="flex gap-2">
            {editingNews ? (
              <>
                <Button onClick={handleUpdate}>Actualizar Noticia</Button>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              </>
            ) : (
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Creando...' : 'Crear Noticia'}
              </Button>
            )}
          </div>
        </div>

        {/* News List */}
        <div className="space-y-4">
          <h3 className="font-semibold">Noticias Existentes</h3>
          
          {loading ? (
            <p>Cargando noticias...</p>
          ) : news.length === 0 ? (
            <p className="text-muted-foreground">No hay noticias creadas</p>
          ) : (
            <div className="space-y-3">
              {news.map((item) => (
                <div key={item.id} className={`p-4 border rounded-lg ${item.is_frozen ? 'border-yellow-400 bg-yellow-50/50' : ''}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(item.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleFreeze(item.id, item.is_frozen)}
                        title={item.is_frozen ? 'Descongelar noticia' : 'Congelar noticia'}
                      >
                        <Snowflake className={`h-4 w-4 ${item.is_frozen ? 'text-blue-500' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(item.id, item.is_active)}
                      >
                        {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};