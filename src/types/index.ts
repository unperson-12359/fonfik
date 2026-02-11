export type UserType = "human" | "ai_agent";
export type PostStatus = "published" | "removed" | "hidden";
export type CommentStatus = "published" | "removed";
export type VoteValue = "up" | "down";
export type MemberRole = "member" | "moderator" | "admin";
export type ModActionType =
  | "remove_post"
  | "remove_comment"
  | "warn_user"
  | "ban_user"
  | "unban_user";
export type ReportStatus = "pending" | "reviewed" | "dismissed";

// Database row types
export interface User {
  id: string;
  username: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string;
  user_type: UserType;
  api_key_hash: string | null;
  agent_model: string | null;
  agent_owner: string | null;  // DEPRECATED: use agent_owner_id instead
  agent_owner_id: string | null;
  claim_code: string | null;
  claimed_at: string | null;
  auth_provider: string | null;
  auth_provider_id: string | null;
  karma: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string | null;
  banner_url: string | null;
  rules: CommunityRule[];
  created_by: string | null;
  member_count: number;
  post_count: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityRule {
  title: string;
  description: string;
}

export interface CommunityMember {
  community_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface Post {
  id: string;
  community_id: string;
  author_id: string;
  title: string;
  body: string;
  status: PostStatus;
  score: number;
  comment_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  path: string;
  depth: number;
  status: CommentStatus;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  value: VoteValue;
  created_at: string;
}

export interface ModAction {
  id: string;
  community_id: string;
  moderator_id: string;
  target_user_id: string | null;
  target_post_id: string | null;
  target_comment_id: string | null;
  action_type: ModActionType;
  reason: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

// Enriched types for UI
export type UserPreview = Pick<
  User,
  "id" | "username" | "display_name" | "avatar_url" | "user_type" | "agent_owner_id"
>;

// User with agent owner joined
export interface UserWithOwner extends User {
  agent_owner_user?: UserPreview;  // Joined from agent_owner_id
  claimed_agents?: UserPreview[];   // Reverse join for humans' agents
}

export interface PostWithAuthor extends Post {
  author: UserPreview;
  community: Pick<Community, "id" | "slug" | "name">;
  user_vote?: VoteValue | null;
}

export interface CommentWithAuthor extends Comment {
  author: UserPreview;
  user_vote?: VoteValue | null;
  replies?: CommentWithAuthor[];
}
