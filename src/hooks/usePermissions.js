import { useMemo } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import {
  can,
  canAny,
  canAuthorCourses,
  describePermissions,
  getAppNav,
  getRoleLabel,
  getUserRole,
  isInstructor,
  isStaff,
  isStudent,
} from "../utils/permissions.js";

/**
 * Role and permission helpers bound to the signed-in user.
 * Rendering decisions only — the API enforces every action server-side.
 */
export function usePermissions() {
  const { user } = useAuth();

  return useMemo(
    () => ({
      user,
      role: getUserRole(user),
      roleLabel: getRoleLabel(user),
      isStaff: isStaff(user),
      isInstructor: isInstructor(user),
      isStudent: isStudent(user),
      canAuthorCourses: canAuthorCourses(user),
      nav: getAppNav(user),
      permissionRows: describePermissions(user),
      can: (moduleId, action) => can(user, moduleId, action),
      canAny: (moduleId, actions) => canAny(user, moduleId, actions),
    }),
    [user]
  );
}

export default usePermissions;
