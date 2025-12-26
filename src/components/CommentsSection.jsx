import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ArrowBigUp, ChevronLeft, ChevronRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useToast } from './ui/use-toast';

const CommentCard = ({ comment, index, likedComments, handleLike }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 125;
  const shouldTruncate = comment.comment.length > maxLength;

  const displayComment = isExpanded || !shouldTruncate 
    ? comment.comment 
    : `${comment.comment.substring(0, maxLength)}...`;

  const isImplemented = comment.is_implemented == 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={`bg-card border rounded-lg p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow min-h-[340px] ${
        isImplemented ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{comment.username}</h4>
              <p className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {comment.tool_name && comment.tool_name !== 'General' && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full font-medium">
                {comment.tool_name}
              </span>
            )}
          </div>
        </div>
        
        <div className="mb-6 min-h-[80px]">
          <p className="text-sm text-foreground/90 leading-relaxed break-words inline">
            {displayComment}
          </p>
          {shouldTruncate && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary font-medium ml-1 hover:underline focus:outline-none"
            >
              {isExpanded ? 'Leer menos' : 'Leer más'}
            </button>
          )}
        </div>

        {/* Respuesta del Admin */}
        {comment.respuesta && (
          <div className="mb-4 mt-2 bg-primary/5 p-3 rounded-md border border-primary/10 relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary">Admin:</span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {comment.respuesta}
            </p>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t mt-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleLike(comment.id)}
            disabled={likedComments.includes(comment.id)}
            className={`p-1 rounded-full transition-colors ${
              likedComments.includes(comment.id)
                ? 'text-orange-500 bg-orange-500/10'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <ArrowBigUp className={`h-6 w-6 ${likedComments.includes(comment.id) ? 'fill-current' : ''}`} />
          </button>
          <span className={`font-bold text-sm ${likedComments.includes(comment.id) ? 'text-orange-600' : 'text-muted-foreground'}`}>
            {comment.likes || 0}
          </span>
        </div>
        
        {isImplemented && (
          <div className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs font-bold tracking-wide">¡Implementado!</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const CommentsSection = () => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [likedComments, setLikedComments] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    tool_name: '',
    comment: ''
  });
  const { toast } = useToast();
  const COMMENTS_PER_PAGE = 6;

  // URL del backend
  // Si estamos en producción (Hostinger sin Node), usamos api.php
  // Si estamos en local, usamos el servidor Node.js
  const isProduction = import.meta.env.PROD; 
  const API_ENDPOINT = isProduction ? '/api.php' : 'http://localhost:3002/api/comments';

  const getUrl = (action, id = null) => {
    if (isProduction) {
      // Modo PHP (Hostinger)
      if (action === 'like') return `${API_ENDPOINT}?action=like&id=${id}`;
      return API_ENDPOINT; // GET y POST usan la misma URL base
    } else {
      // Modo Node.js (Local)
      if (action === 'like') return `${API_ENDPOINT}/${id}/like`;
      return API_ENDPOINT;
    }
  };

  useEffect(() => {
    fetchComments();
    // Cargar likes guardados en localStorage (simulando cookie)
    const savedLikes = JSON.parse(localStorage.getItem('liked_comments') || '[]');
    setLikedComments(savedLikes);
  }, []);

  const fetchComments = async () => {
    try {
      const response = await fetch(getUrl('list'));
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.comment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(getUrl('create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Comentario enviado',
          description: 'Gracias por tu sugerencia.',
        });
        setFormData({ username: '', tool_name: '', comment: '' });
        fetchComments();
        setCurrentPage(1); // Volver a la primera página
      } else {
        throw new Error('Error al enviar');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el comentario.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId) => {
    if (likedComments.includes(commentId)) return;

    try {
      const response = await fetch(getUrl('like', commentId), {
        method: 'POST'
      });

      if (response.ok) {
        // Actualizar estado local
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, likes: parseInt(c.likes || 0) + 1 } : c
        ));
        
        // Guardar en localStorage
        const newLiked = [...likedComments, commentId];
        setLikedComments(newLiked);
        localStorage.setItem('liked_comments', JSON.stringify(newLiked));
      }
    } catch (error) {
      console.error('Error dando like:', error);
    }
  };

  // Paginación
  const indexOfLastComment = currentPage * COMMENTS_PER_PAGE;
  const indexOfFirstComment = indexOfLastComment - COMMENTS_PER_PAGE;
  const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Comunidad y Sugerencias
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ayúdanos a mejorar. Deja tus ideas o vota por las funcionalidades que te gustaría ver.
          </p>
        </div>

        {/* Form Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="shadow-sm border bg-card">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre</label>
                    <input
                      type="text"
                      maxLength={50}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Tu nombre"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Herramienta (Opcional)</label>
                    <input
                      type="text"
                      maxLength={100}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Ej. Convertidor PDF"
                      value={formData.tool_name}
                      onChange={(e) => setFormData({...formData, tool_name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Comentario</label>
                    <span className="text-xs text-muted-foreground">{formData.comment.length}/500</span>
                  </div>
                  <textarea
                    maxLength={500}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    placeholder="Comparte tu idea..."
                    value={formData.comment}
                    onChange={(e) => setFormData({...formData, comment: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Enviando...' : 'Publicar Comentario'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Comments Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 mb-8">
          <AnimatePresence mode="popLayout">
            {currentComments.map((comment, index) => (
              <div key={comment.id} className="break-inside-avoid mb-6 inline-block w-full">
                <CommentCard 
                  comment={comment} 
                  index={index} 
                  likedComments={likedComments} 
                  handleLike={handleLike} 
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CommentsSection;
