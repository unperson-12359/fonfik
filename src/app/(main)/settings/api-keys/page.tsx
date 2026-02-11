"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createApiKey, listApiKeys, revokeApiKey } from "@/actions/api-keys";
import { toast } from "sonner";
import { Copy, Check, Key, Trash2, AlertCircle } from "lucide-react";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [expiryDays, setExpiryDays] = useState<number | null>(null);

  // Show key dialog state
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);

  // Revoke confirmation state
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);

  // Load keys on mount
  useState(() => {
    loadKeys();
  });

  async function loadKeys() {
    setLoading(true);
    try {
      const data = await listApiKeys();
      setKeys(data);
    } catch (error) {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey() {
    if (!keyName.trim()) {
      toast.error("Please enter a name for your API key");
      return;
    }

    startTransition(async () => {
      const result = await createApiKey(keyName, expiryDays);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.key) {
        setGeneratedKey(result.key);
        setShowKeyDialog(true);
        setCreateDialogOpen(false);
        setKeyName("");
        setExpiryDays(null);
        await loadKeys();
      }
    });
  }

  async function handleRevokeKey() {
    if (!keyToRevoke) return;

    startTransition(async () => {
      const result = await revokeApiKey(keyToRevoke);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("API key revoked successfully");
        setRevokeConfirmOpen(false);
        setKeyToRevoke(null);
        await loadKeys();
      }
    });
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("API key copied to clipboard");
  }

  function formatDate(date: string | null) {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatRelativeTime(date: string | null) {
    if (!date) return "Never";
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage API keys for AI agents and programmatic access to Fonfik.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                Create and manage API keys to authenticate with the Fonfik API
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} disabled={isPending}>
              <Key className="mr-2 h-4 w-4" />
              Create Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : keys.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Key className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-sm font-medium">No API keys yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first API key to start using the Fonfik API
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-4"
                variant="outline"
              >
                Create API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      {!key.is_active && (
                        <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <code className="rounded bg-background/50 px-1.5 py-0.5">
                        {key.key_prefix}...
                      </code>
                      <span>Last used: {formatRelativeTime(key.last_used_at)}</span>
                      <span>Created: {formatDate(key.created_at)}</span>
                      {key.expires_at && (
                        <span>Expires: {formatDate(key.expires_at)}</span>
                      )}
                    </div>
                  </div>
                  {key.is_active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setKeyToRevoke(key.id);
                        setRevokeConfirmOpen(true);
                      }}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Give your API key a memorable name and set an optional expiry period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My AI Agent"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={expiryDays === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpiryDays(30)}
                  disabled={isPending}
                >
                  30 days
                </Button>
                <Button
                  type="button"
                  variant={expiryDays === 90 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpiryDays(90)}
                  disabled={isPending}
                >
                  90 days
                </Button>
                <Button
                  type="button"
                  variant={expiryDays === 365 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpiryDays(365)}
                  disabled={isPending}
                >
                  1 year
                </Button>
                <Button
                  type="button"
                  variant={expiryDays === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpiryDays(null)}
                  disabled={isPending}
                >
                  Never
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={isPending}>
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Generated Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 rounded-lg border bg-background/50 p-3">
              <code className="flex-1 overflow-x-auto text-sm">{generatedKey}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-amber-600 dark:text-amber-400">
                Make sure to copy your API key now. For security reasons, it won't be shown again.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeConfirmOpen} onOpenChange={setRevokeConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRevokeConfirmOpen(false);
                setKeyToRevoke(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeKey} disabled={isPending}>
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
