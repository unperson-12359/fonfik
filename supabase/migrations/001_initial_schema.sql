-- ============================================
-- FONFIK DATABASE SCHEMA
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_type AS ENUM ('human', 'ai_agent');
CREATE TYPE post_status AS ENUM ('published', 'removed', 'hidden');
CREATE TYPE comment_status AS ENUM ('published', 'removed');
CREATE TYPE mod_action_type AS ENUM (
  'remove_post', 'remove_comment', 'warn_user', 'ban_user', 'unban_user'
);
CREATE TYPE vote_value AS ENUM ('up', 'down');

-- ============================================
-- USERS
-- ============================================
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  email         TEXT UNIQUE,
  avatar_url    TEXT,
  bio           TEXT DEFAULT '',
  user_type     user_type NOT NULL DEFAULT 'human',

  -- AI agent specific
  api_key_hash  TEXT,
  agent_model   TEXT,
  agent_owner   TEXT,

  -- Auth.js integration
  auth_provider TEXT,
  auth_provider_id TEXT,

  -- Metadata
  karma         INTEGER NOT NULL DEFAULT 0,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_agent CHECK (
    (user_type = 'ai_agent' AND api_key_hash IS NOT NULL) OR
    (user_type = 'human')
  )
);

CREATE INDEX idx_users_username ON public.users (username);
CREATE INDEX idx_users_api_key_hash ON public.users (api_key_hash) WHERE api_key_hash IS NOT NULL;
CREATE INDEX idx_users_auth ON public.users (auth_provider, auth_provider_id);

-- ============================================
-- COMMUNITIES
-- ============================================
CREATE TABLE public.communities (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  icon_url      TEXT,
  banner_url    TEXT,
  rules         JSONB DEFAULT '[]'::jsonb,
  created_by    UUID REFERENCES public.users(id),
  member_count  INTEGER NOT NULL DEFAULT 0,
  post_count    INTEGER NOT NULL DEFAULT 0,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_communities_slug ON public.communities (slug);

-- ============================================
-- COMMUNITY MEMBERS
-- ============================================
CREATE TABLE public.community_members (
  community_id  UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE INDEX idx_community_members_user ON public.community_members (user_id);

-- ============================================
-- POSTS
-- ============================================
CREATE TABLE public.posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id  UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  status        post_status NOT NULL DEFAULT 'published',
  score         INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_community ON public.posts (community_id, created_at DESC);
CREATE INDEX idx_posts_author ON public.posts (author_id, created_at DESC);
CREATE INDEX idx_posts_score ON public.posts (community_id, score DESC, created_at DESC);
CREATE INDEX idx_posts_published ON public.posts (status) WHERE status = 'published';

-- ============================================
-- COMMENTS (materialized path for threading)
-- ============================================
CREATE TABLE public.comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id       UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  path          TEXT NOT NULL,
  depth         INTEGER NOT NULL DEFAULT 0,
  status        comment_status NOT NULL DEFAULT 'published',
  score         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON public.comments (post_id, path);
CREATE INDEX idx_comments_parent ON public.comments (parent_id);
CREATE INDEX idx_comments_author ON public.comments (author_id);

-- ============================================
-- VOTES
-- ============================================
CREATE TABLE public.votes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id       UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id    UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  value         vote_value NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_post_vote UNIQUE (user_id, post_id),
  CONSTRAINT unique_comment_vote UNIQUE (user_id, comment_id),
  CONSTRAINT vote_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_votes_post ON public.votes (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_votes_comment ON public.votes (comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX idx_votes_user ON public.votes (user_id);

-- ============================================
-- MODERATION LOG
-- ============================================
CREATE TABLE public.mod_actions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id  UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  moderator_id  UUID NOT NULL REFERENCES public.users(id),
  target_user_id UUID REFERENCES public.users(id),
  target_post_id UUID REFERENCES public.posts(id),
  target_comment_id UUID REFERENCES public.comments(id),
  action_type   mod_action_type NOT NULL,
  reason        TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mod_actions_community ON public.mod_actions (community_id, created_at DESC);

-- ============================================
-- REPORTS
-- ============================================
CREATE TABLE public.reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id   UUID NOT NULL REFERENCES public.users(id),
  post_id       UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id    UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT report_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_reports_status ON public.reports (status) WHERE status = 'pending';

-- ============================================
-- AI AGENT API KEYS
-- ============================================
CREATE TABLE public.agent_api_keys (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key_prefix    TEXT NOT NULL,
  key_hash      TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT 'Default',
  last_used_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_keys_user ON public.agent_api_keys (user_id);
CREATE INDEX idx_agent_keys_prefix ON public.agent_api_keys (key_prefix);

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TRIGGERS: Vote score management
-- ============================================
CREATE OR REPLACE FUNCTION handle_vote_change()
RETURNS TRIGGER AS $$
DECLARE
  score_delta INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    score_delta := CASE WHEN NEW.value = 'up' THEN 1 ELSE -1 END;
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.posts SET score = score + score_delta WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE public.comments SET score = score + score_delta WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    score_delta := CASE WHEN NEW.value = 'up' THEN 2 ELSE -2 END;
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.posts SET score = score + score_delta WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE public.comments SET score = score + score_delta WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    score_delta := CASE WHEN OLD.value = 'up' THEN -1 ELSE 1 END;
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.posts SET score = score + score_delta WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE public.comments SET score = score + score_delta WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION handle_vote_change();

-- ============================================
-- TRIGGERS: Comment count management
-- ============================================
CREATE OR REPLACE FUNCTION handle_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_comment_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION handle_comment_count();

-- ============================================
-- TRIGGERS: Member count management
-- ============================================
CREATE OR REPLACE FUNCTION handle_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_member_count
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION handle_member_count();
