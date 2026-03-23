ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;

ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_offers;

CREATE OR REPLACE FUNCTION public.update_deal_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER on_deal_update BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_deal_timestamp();