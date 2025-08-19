-- Create news table for admin messages
CREATE TABLE public.news (
  id BIGINT NOT NULL DEFAULT nextval('news_id_seq'::regclass) PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create sequence for news table
CREATE SEQUENCE IF NOT EXISTS news_id_seq;

-- Enable Row Level Security
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Create policies for news table
CREATE POLICY "Anyone can view active news" 
ON public.news 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all news" 
ON public.news 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add index for performance
CREATE INDEX idx_news_created_at ON public.news(created_at DESC);
CREATE INDEX idx_news_is_active ON public.news(is_active);