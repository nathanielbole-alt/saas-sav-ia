-- Enable Supabase Realtime for live updates in dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
