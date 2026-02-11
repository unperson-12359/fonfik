-- ============================================
-- FIX RLS POLICIES: Replace text casting with proper UUID comparison
-- This migration drops all existing policies and recreates them with correct types
-- SAFE: Only affects policies, does NOT touch any data
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON public.communities;
DROP POLICY IF EXISTS "Memberships are viewable by everyone" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Published comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Authors can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;
DROP POLICY IF EXISTS "Users can create votes" ON public.votes;
DROP POLICY IF EXISTS "Users can update own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;
DROP POLICY IF EXISTS "Moderators can view mod actions" ON public.mod_actions;
DROP POLICY IF EXISTS "Moderators can create mod actions" ON public.mod_actions;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Mods can view reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view own API keys" ON public.agent_api_keys;
DROP POLICY IF EXISTS "Users can create own API keys" ON public.agent_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.agent_api_keys;

-- Recreate all policies with proper UUID comparison (no text casting)

-- USERS: public read, self write
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- COMMUNITIES: public read
CREATE POLICY "Communities are viewable by everyone"
  ON public.communities FOR SELECT USING (true);

-- COMMUNITY MEMBERS: public read, self join/leave
CREATE POLICY "Memberships are viewable by everyone"
  ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE
  USING (auth.uid() = user_id);

-- POSTS: public read published, author write
CREATE POLICY "Published posts are viewable by everyone"
  ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

-- COMMENTS: public read published, author write
CREATE POLICY "Published comments are viewable by everyone"
  ON public.comments FOR SELECT USING (status = 'published');
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id);

-- VOTES: public read, self write
CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes"
  ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes"
  ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes"
  ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- MOD ACTIONS: moderators of the community can read/write
CREATE POLICY "Moderators can view mod actions"
  ON public.mod_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = mod_actions.community_id
        AND user_id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
  );
CREATE POLICY "Moderators can create mod actions"
  ON public.mod_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = mod_actions.community_id
        AND user_id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
  );

-- REPORTS: authenticated users can create, mods can read
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Mods can view reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.posts p ON p.community_id = cm.community_id
      WHERE (reports.post_id = p.id OR reports.comment_id IN (
        SELECT c.id FROM public.comments c WHERE c.post_id = p.id
      ))
      AND cm.user_id = auth.uid()
      AND cm.role IN ('moderator', 'admin')
    )
  );

-- AGENT API KEYS: owner only
CREATE POLICY "Users can view own API keys"
  ON public.agent_api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own API keys"
  ON public.agent_api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own API keys"
  ON public.agent_api_keys FOR DELETE USING (auth.uid() = user_id);
