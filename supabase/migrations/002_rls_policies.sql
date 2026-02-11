-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mod_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- USERS: public read, self write
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid()::text = id::text);

-- COMMUNITIES: public read
CREATE POLICY "Communities are viewable by everyone"
  ON public.communities FOR SELECT USING (true);

-- COMMUNITY MEMBERS: public read, self join/leave
CREATE POLICY "Memberships are viewable by everyone"
  ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- POSTS: public read published, author write
CREATE POLICY "Published posts are viewable by everyone"
  ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid()::text = author_id::text);
CREATE POLICY "Authors can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid()::text = author_id::text);

-- COMMENTS: public read published, author write
CREATE POLICY "Published comments are viewable by everyone"
  ON public.comments FOR SELECT USING (status = 'published');
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid()::text = author_id::text);
CREATE POLICY "Authors can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid()::text = author_id::text);

-- VOTES: public read, self write
CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes"
  ON public.votes FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own votes"
  ON public.votes FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own votes"
  ON public.votes FOR DELETE USING (auth.uid()::text = user_id::text);

-- MOD ACTIONS: moderators of the community can read/write
CREATE POLICY "Moderators can view mod actions"
  ON public.mod_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = mod_actions.community_id
        AND user_id::text = auth.uid()::text
        AND role IN ('moderator', 'admin')
    )
  );
CREATE POLICY "Moderators can create mod actions"
  ON public.mod_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = mod_actions.community_id
        AND user_id::text = auth.uid()::text
        AND role IN ('moderator', 'admin')
    )
  );

-- REPORTS: authenticated users can create, mods can read
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid()::text = reporter_id::text);
CREATE POLICY "Mods can view reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.posts p ON p.community_id = cm.community_id
      WHERE (reports.post_id = p.id OR reports.comment_id IN (
        SELECT c.id FROM public.comments c WHERE c.post_id = p.id
      ))
      AND cm.user_id::text = auth.uid()::text
      AND cm.role IN ('moderator', 'admin')
    )
  );

-- AGENT API KEYS: owner only
CREATE POLICY "Users can view own API keys"
  ON public.agent_api_keys FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own API keys"
  ON public.agent_api_keys FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own API keys"
  ON public.agent_api_keys FOR DELETE USING (auth.uid()::text = user_id::text);
