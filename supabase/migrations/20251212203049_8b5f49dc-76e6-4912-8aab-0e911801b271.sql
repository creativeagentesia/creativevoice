-- Create agent_config table
CREATE TABLE public.agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name TEXT NOT NULL DEFAULT 'Restaurant',
  restaurant_hours TEXT NOT NULL DEFAULT 'Monday-Sunday: 5:00 PM - 10:00 PM',
  menu TEXT NOT NULL DEFAULT 'Menu items',
  instructions TEXT NOT NULL DEFAULT 'You are a friendly restaurant receptionist. Be helpful and professional.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policy for agent_config
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to agent_config" ON public.agent_config FOR ALL USING (true) WITH CHECK (true);

-- Insert default config
INSERT INTO public.agent_config (restaurant_name, restaurant_hours, menu, instructions) 
VALUES (
  'Demo Restaurant',
  'Monday-Sunday: 5:00 PM - 10:00 PM',
  'Starters: Caesar Salad, Soup of the Day. Mains: Grilled Salmon, Ribeye Steak, Vegetarian Pasta. Desserts: Tiramisu, Chocolate Cake.',
  'You are a friendly receptionist for our restaurant. Help customers make reservations and answer questions about our menu and hours. Always be professional and courteous.'
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  guests INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to reservations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for reservations
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to agent_config
CREATE TRIGGER update_agent_config_updated_at
BEFORE UPDATE ON public.agent_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();