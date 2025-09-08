import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Edit2, Eye, EyeOff, Snowflake, Plus, List } from 'lucide-react';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  
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
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
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
    setIsEditModalOpen(true);
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
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="jambol-button flex items-center gap-2">
                <Plus size={16} />
                Crear Nueva Noticia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nueva Noticia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-title">Título</Label>
                  <Input
                    id="modal-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título de la noticia"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modal-content">Contenido</Label>
                  <Textarea
                    id="modal-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Contenido de la noticia"
                    rows={4}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button className="jambol-button" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button className="jambol-button" onClick={handleCreate} disabled={creating}>
                    {creating ? 'Creando...' : 'Crear Noticia'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isViewAllModalOpen} onOpenChange={setIsViewAllModalOpen}>
            <DialogTrigger asChild>
              <Button className="jambol-button flex items-center gap-2">
                <List size={16} />
                Ver Todas las Noticias
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Noticia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título de la noticia"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-content">Contenido</Label>
                <Textarea
                  id="edit-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Contenido de la noticia"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button className="jambol-button" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button className="jambol-button" onClick={handleUpdate}>
                  Actualizar Noticia
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View All Modal */}
        <Dialog open={isViewAllModalOpen} onOpenChange={setIsViewAllModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Todas las Noticias</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {loading ? (
                <p>Cargando noticias...</p>
              ) : news.length === 0 ? (
                <p className="text-muted-foreground">No hay noticias creadas</p>
              ) : (
                <div className="space-y-4">
                  {news.map((item) => (
                    <div key={item.id} className={`p-4 border rounded-lg ${item.is_frozen ? 'border-warning bg-warning/10' : ''}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(item.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                          <Button
                            size="sm"
                            className="jambol-button w-full sm:w-auto"
                            onClick={() => handleToggleFreeze(item.id, item.is_frozen)}
                            title={item.is_frozen ? 'Descongelar noticia' : 'Congelar noticia'}
                          >
                            <Snowflake className={`h-4 w-4 ${item.is_frozen ? 'text-blue-500' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            className="jambol-button w-full sm:w-auto"
                            onClick={() => handleToggleActive(item.id, item.is_active)}
                          >
                            {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            className="jambol-button w-full sm:w-auto"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                            className="w-full sm:w-auto"
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
          </DialogContent>
        </Dialog>

        {/* News List - Only Frozen */}
        <div className="space-y-4">
          <h3 className="font-semibold">Noticias Congeladas</h3>
          
          {loading ? (
            <p>Cargando noticias...</p>
          ) : news.filter(item => item.is_frozen).length === 0 ? (
            <p className="text-muted-foreground">No hay noticias congeladas</p>
          ) : (
            <div className="space-y-3">
              {news.filter(item => item.is_frozen).map((item) => (
                <div key={item.id} className={`p-4 border rounded-lg ${item.is_frozen ? 'border-warning bg-warning/10' : ''}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(item.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        className="jambol-button"
                        onClick={() => handleToggleFreeze(item.id, item.is_frozen)}
                        title={item.is_frozen ? 'Descongelar noticia' : 'Congelar noticia'}
                      >
                        <Snowflake className={`h-4 w-4 ${item.is_frozen ? 'text-blue-500' : ''}`} />
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