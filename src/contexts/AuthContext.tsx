import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type TeamRole = "admin" | "manager" | "editor" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  rolesLoaded: boolean;
  isAdmin: boolean;
  isTeamMember: boolean;
  teamRole: TeamRole;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamRole, setTeamRole] = useState<TeamRole>(null);

  const isTeamMember = teamRole === "admin" || teamRole === "manager" || teamRole === "editor";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        setRolesLoaded(false);
        setTimeout(() => {
          checkRoles(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setTeamRole(null);
        setRolesLoaded(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkRoles(session.user.id);
      } else {
        setRolesLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roles = (data || []).map((r) => r.role);
    setIsAdmin(roles.includes("admin"));

    if (roles.includes("admin")) setTeamRole("admin");
    else if (roles.includes("manager")) setTeamRole("manager");
    else if (roles.includes("editor")) setTeamRole("editor");
    else setTeamRole(null);

    setRolesLoaded(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setTeamRole(null);
    setRolesLoaded(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, rolesLoaded, isAdmin, isTeamMember, teamRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
