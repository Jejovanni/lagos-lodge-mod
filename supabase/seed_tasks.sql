// supabase/seed_tasks.sql
-- Default ritual tasks across ranks for Lagos Life Secret Society Mod

INSERT INTO secret_tasks (rank_required, title, description, prestige_reward) VALUES
  ('novice', 'The Silent Observer', 'Visit three districts in Lagos Life without speaking in public chat.', 50),
  ('novice', 'The Foundation Stone', 'Contribute your first offering to the Lodge Treasury.', 100),
  ('initiate', 'Whispers in the Dark', 'Recruit a prospective member who submits a petition to the Lodge.', 250),
  ('initiate', 'The Midnight Walk', 'Remain active during late-night hours in Lagos Life for 3 consecutive nights.', 300),
  ('craftsman', 'The Architect’s Toll', 'Sponsor a fellow Initiate and verify their dedication.', 600),
  ('fellowcraft', 'Keeper of the Ledger', 'Audit or participate in a Lodge Treasury drive exceeding ₦10,000 equivalent.', 1200),
  ('master', 'The Inner Council', 'Review and vote on at least 5 pending Lodge petitions.', 2500)
ON CONFLICT DO NOTHING;
