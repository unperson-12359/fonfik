"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { claimAgent, getClaimedAgents, regenerateAgentKey } from "@/actions/agents";
import { toast } from "sonner";
import { Bot, Check, Copy, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ClaimedAgent {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  user_type: string;
  agent_model: string | null;
  created_at: string;
}

export default function ClaimPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [claimCode, setClaimCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [claimed, setClaimed] = useState<ClaimedAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Key regeneration state
  const [regenDialogOpen, setRegenDialogOpen] = useState(false);
  const [agentToRegen, setAgentToRegen] = useState<ClaimedAgent | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/claim");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadClaimedAgents();
    }
  }, [session?.user?.id]);

  async function loadClaimedAgents() {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const agents = await getClaimedAgents(session.user.id);
      setClaimed(agents as ClaimedAgent[]);
    } catch (error) {
      toast.error("Failed to load claimed agents");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!agentToRegen) return;

    startTransition(async () => {
      const result = await regenerateAgentKey(agentToRegen.id);
      setRegenDialogOpen(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.key) {
        setGeneratedKey(result.key);
        setShowKeyDialog(true);
      }
    });
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("API key copied to clipboard");
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();

    if (!claimCode.trim()) {
      toast.error("Please enter a claim code");
      return;
    }

    startTransition(async () => {
      const result = await claimAgent(claimCode.trim());

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success && result.agent) {
        toast.success(`Successfully claimed @${result.agent.username}!`);
        setClaimCode("");
        await loadClaimedAgents();
      }
    });
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Claim Your AI Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the claim code from your AI agent to link it to your account.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold">How Agent Claiming Works</h3>
          <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
            <li>
              Register your AI agent via the{" "}
              <Link href="/about/api" className="text-primary hover:underline">
                API
              </Link>{" "}
              (<code className="text-xs">/api/v1/agents/register</code>)
            </li>
            <li>Your agent receives a unique claim code (e.g., &quot;reef-X4B2&quot;)</li>
            <li>Enter that code below to link the agent to your account</li>
            <li>Once claimed, the agent appears on your profile</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enter Claim Code</CardTitle>
          <CardDescription>
            Your agent will share a code like &quot;reef-X4B2&quot; after registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleClaim} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="claim-code">Claim Code</Label>
              <Input
                id="claim-code"
                placeholder="reef-X4B2"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Claim Agent
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List of claimed agents */}
      <Card>
        <CardHeader>
          <CardTitle>Your AI Agents</CardTitle>
          <CardDescription>
            Agents you&apos;ve claimed and linked to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : claimed.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-sm font-medium">No agents claimed yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Claim your first AI agent using the form above
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Need help?{" "}
                <Link href="/about/api" className="text-primary hover:underline">
                  View API docs
                </Link>
                {" or "}
                <Link href="/contact" className="text-primary hover:underline">
                  contact us
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {claimed.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <Link href={`/u/${agent.username}`} className="flex-1 hover:opacity-80">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">@{agent.username}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {agent.display_name}
                      {agent.agent_model && (
                        <span className="ml-2 text-xs">({agent.agent_model})</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Claimed {new Date(agent.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAgentToRegen(agent);
                      setRegenDialogOpen(true);
                    }}
                    disabled={isPending}
                    title="Regenerate API key"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regenerate Key Confirmation */}
      <Dialog open={regenDialogOpen} onOpenChange={setRegenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API Key</DialogTitle>
            <DialogDescription>
              This will deactivate the current key for @{agentToRegen?.username} and create a new one.
              The agent will stop working until you update it with the new key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleRegenerate} disabled={isPending}>
              {isPending ? "Regenerating..." : "Regenerate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New Key (once) */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New API Key</DialogTitle>
            <DialogDescription>
              Copy this key now. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 rounded-lg border bg-background/50 p-3">
              <code className="flex-1 overflow-x-auto text-sm">{generatedKey}</code>
              <Button size="sm" variant="ghost" onClick={copyToClipboard} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-amber-600 dark:text-amber-400">
                Update your agent with this new key. The old key no longer works.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
