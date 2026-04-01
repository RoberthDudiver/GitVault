"use client";

import { useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface AdminUser {
  userId: string;
  email: string;
  displayName: string | null;
  gitHubLogin: string | null;
  plan: string;
  isBlocked: boolean;
  gitHubInstallationId: number | null;
  createdAt: string;
  vaultCount: number;
}

function LoginForm({ onLogin }: { onLogin: (secret: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/v1/admin/users`, {
        headers: { "X-Admin-Secret": value },
      });
      if (res.ok) {
        onLogin(value);
      } else {
        setError("Clave incorrecta.");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-100 mb-6 text-center">GitVault Admin</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Admin secret"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !value}
            className="rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-300 disabled:opacity-50 transition-colors"
          >
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function UserTable({ secret }: { secret: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/v1/admin/users`, {
        headers: { "X-Admin-Secret": secret },
      });
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError("Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useState(() => { load(); });

  const doBlock = async (userId: string, block: boolean) => {
    setActionLoading(userId);
    try {
      await fetch(`${API}/v1/admin/users/${userId}/${block ? "block" : "unblock"}`, {
        method: "POST",
        headers: { "X-Admin-Secret": secret },
      });
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const doDelete = async (userId: string) => {
    setActionLoading(userId);
    try {
      await fetch(`${API}/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "X-Admin-Secret": secret },
      });
      setDeleteConfirm(null);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
    </div>
  );

  if (error) return <p className="text-red-400 text-sm text-center py-10">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-400">{users.length} usuario{users.length !== 1 ? "s" : ""}</h2>
        <button onClick={load} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Actualizar</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left">
              <th className="px-4 py-3 text-xs font-medium text-zinc-400">Email</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-400">GitHub</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-400">Plan</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-400">Vaults</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-400">GitHub App</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-400">Estado</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-400">Creado</th>
              <th className="px-4 py-3 text-xs font-medium text-zinc-400">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId} className="border-b border-zinc-800/50 last:border-0">
                <td className="px-4 py-3 text-zinc-100">
                  <div>{u.email}</div>
                  {u.displayName && <div className="text-xs text-zinc-500">{u.displayName}</div>}
                </td>
                <td className="px-4 py-3 text-zinc-400">{u.gitHubLogin ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">{u.plan}</span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-center">{u.vaultCount}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.gitHubInstallationId ? "bg-green-900/40 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>
                    {u.gitHubInstallationId ? "conectado" : "no conectado"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isBlocked ? "bg-red-900/40 text-red-400" : "bg-green-900/40 text-green-400"}`}>
                    {u.isBlocked ? "bloqueado" : "activo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {new Date(u.createdAt).toLocaleDateString("es")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => doBlock(u.userId, !u.isBlocked)}
                      disabled={actionLoading === u.userId}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors disabled:opacity-40 ${
                        u.isBlocked
                          ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                          : "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50"
                      }`}
                    >
                      {u.isBlocked ? "Desbloquear" : "Bloquear"}
                    </button>
                    {deleteConfirm === u.userId ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => doDelete(u.userId)}
                          disabled={actionLoading === u.userId}
                          className="text-xs px-2.5 py-1 rounded-md bg-red-900/40 text-red-400 hover:bg-red-900/60 disabled:opacity-40 transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(u.userId)}
                        className="text-xs px-2.5 py-1 rounded-md bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [secret, setSecret] = useState<string | null>(null);

  if (!secret) return <LoginForm onLogin={setSecret} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold">GitVault Admin</h1>
          <button
            onClick={() => setSecret(null)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
        <UserTable secret={secret} />
      </div>
    </div>
  );
}
