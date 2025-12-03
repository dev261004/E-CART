// src/components/RoleProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getUser } from "@/services/authService";
import type { TRole } from "@/types/user";

/**
 * Props:
 *  - role: required role string OR array of roles
 *  - children: component to render if authorized
 */
type Props = {
  role: TRole | TRole[];
  children: React.ReactElement;
};

export default function RoleProtectedRoute({ role, children }: Props) {
  const user = getUser();
//console.log("user:",user)
  // not logged in -> go to login
  if (!user) return <Navigate to="/login" replace />;

  const allowed = Array.isArray(role) ? role.includes(user.role) : user.role === role;

  if (!allowed) {
    // not authorized -> redirect to home (or a 403 page)
    return <Navigate to="/" replace />;
  }

  return children;
}
