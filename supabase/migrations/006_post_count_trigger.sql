-- ============================================
-- FIX: Add post_count trigger (matching comment_count and member_count patterns)
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION handle_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET post_count = post_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_change ON posts;
CREATE TRIGGER on_post_change
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION handle_post_count();
