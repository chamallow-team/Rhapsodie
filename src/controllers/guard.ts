import * as path from "node:path";
import { parse } from "@std/toml";
import { getLogger } from "@logtape/logtape";

// --- Types ---
type Permissions = Record<string, boolean>;

interface Group {
  roles: string[];
  permissions: Permissions;
}

interface User {
  roles: string[];
  groups: string[];
  permissions: Permissions;
}

// ===================================================================
//
//    STORAGE
//
// ===================================================================

const groups = new Map<string, Group>();
const users = new Map<string, User>();
const roles = new Map<string, Permissions>();
const logger = getLogger(["app", "guard"]);

// ===================================================================
//
//    CONFIGURATION
//
// ===================================================================

const DEFAULT_GROUP = "default";
const ROLES_KEY = "roles";
const GROUPS_KEY = "groups";
const USERS_KEY = "users";

// --- Interface pour les options de checkPerms ---
/**
 * Définit les critères de vérification pour checkPerms.
 * L'utilisateur doit satisfaire au moins une des conditions spécifiées.
 */
export interface CheckOptions {
  /** Liste de permissions requises. L'utilisateur doit posséder TOUTES ces permissions. */
  permissions?: string | string[];
  /** Liste de rôles requis. L'utilisateur doit posséder AU MOINS UN de ces rôles directement. */
  roles?: string | string[];
  /** Liste de groupes requis. L'utilisateur doit appartenir AU MOINS UN de ces groupes directement. */
  groups?: string | string[];
}

// ===================================================================
//
//    LOADING FUNCTIONS
//
// ===================================================================

export function readPermissions(): void {
  logger.info("Reading permissions...");
  try {
    const config = loadConfigFile();
    // Clear all existing permissions to avoid conflicts
    roles.clear();
    groups.clear();
    users.clear();

    loadRoles(config);
    loadGroups(config);
    loadUsers(config);
    logger.info("Permissions loaded successfully.");
  } catch (error) {
    logger.error(`Failed to read or parse permissions file: ${error}`);
    throw error;
  }
}

function loadConfigFile(): Record<any, any> {
  const permsPath = path.join(
    import.meta.dirname!,
    "../../",
    "permissions.toml",
  );
  logger.debug(`Loading permissions from: ${permsPath}`);
  return parse(Deno.readTextFileSync(permsPath));
}

function loadRoles(config: Record<any, any>): void {
  // Vérifier que config.roles est bien un objet
  if (!config[ROLES_KEY] || typeof config[ROLES_KEY] !== "object") return;

  for (
    const [name, rolePermissions] of Object.entries(
      config[ROLES_KEY] as Record<any, any>,
    )
  ) {
    if (typeof rolePermissions === "object" && rolePermissions !== null) {
      roles.set(
        name,
        createPermissionsObject(rolePermissions as Record<string, unknown>),
      );
    } else {
      logger.warn(`Invalid format for role "${name}". Skipping.`);
    }
  }
}

function loadGroups(config: Record<any, any>): void {
  if (!config[GROUPS_KEY] || typeof config[GROUPS_KEY] !== "object") return;

  for (
    const [name, groupConfig] of Object.entries(
      config[GROUPS_KEY] as Record<any, any>,
    )
  ) {
    if (typeof groupConfig !== "object" || groupConfig === null) {
      logger.warn(`Invalid format for group "${name}". Skipping.`);
      continue;
    }

    const groupRoles = Array.isArray(groupConfig[ROLES_KEY])
      ? groupConfig[ROLES_KEY].map(String).filter((r) =>
        roles.has(r) || logger.warn(`Role "${r}" in group "${name}" not found.`)
      )
      : [];

    const { [ROLES_KEY]: _, ...directPermissions } = groupConfig;

    groups.set(name, {
      roles: groupRoles,
      permissions: createPermissionsObject(
        directPermissions as Record<string, unknown>,
      ),
    });
  }
}

function loadUsers(config: Record<any, any>): void {
  if (!config[USERS_KEY] || typeof config[USERS_KEY] !== "object") return;

  for (
    const [userId, userConfig] of Object.entries(
      config[USERS_KEY] as Record<any, any>,
    )
  ) {
    if (typeof userConfig !== "object" || userConfig === null) {
      logger.warn(`Invalid format for user "${userId}". Skipping.`);
      continue;
    }

    const userRoles = Array.isArray(userConfig[ROLES_KEY])
      ? userConfig[ROLES_KEY].map(String).filter((r) =>
        roles.has(r) ||
        logger.warn(`Role "${r}" for user "${userId}" not found.`)
      )
      : [];
    const userGroups = Array.isArray(userConfig[GROUPS_KEY])
      ? userConfig[GROUPS_KEY].map(String).filter((g) =>
        groups.has(g) ||
        logger.warn(`Group "${g}" for user "${userId}" not found.`)
      )
      : [];

    const { [ROLES_KEY]: _, [GROUPS_KEY]: __, ...directPermissions } =
      userConfig;

    users.set(userId, {
      roles: userRoles,
      groups: userGroups,
      permissions: createPermissionsObject(
        directPermissions as Record<string, unknown>,
      ),
    });
  }
}

function createPermissionsObject(
  records: Record<string, unknown>,
): Permissions {
  const permissions: Permissions = {};
  for (const [key, value] of Object.entries(records)) {
    if (typeof value === "boolean") {
      permissions[key] = value;
    } else {
      logger.warn(
        `Invalid value type for permission "${key}" (expected boolean, got ${typeof value}). Skipping.`,
      );
    }
  }
  return permissions;
}

// ===================================================================
//
//    VERIFICATION & UTILITY FUNCTIONS
//
// ===================================================================

export function getUserPermissions(userId: string): Permissions {
  const user = users.get(userId) ?? createDefaultUser(userId);
  return computeUserPermissions(user);
}

function createDefaultUser(userIdForLog?: string): User {
  if (userIdForLog) {
    logger.debug(
      `User "${userIdForLog}" not found. Using default group "${DEFAULT_GROUP}".`,
    );
  }

  if (!groups.has(DEFAULT_GROUP)) {
    logger.warn(
      `Default group "${DEFAULT_GROUP}" is not defined in permissions file.`,
    );
    return { roles: [], groups: [], permissions: {} };
  }
  return {
    roles: [],
    groups: [DEFAULT_GROUP],
    permissions: {},
  };
}

function computeUserPermissions(user: User): Permissions {
  // User Direct -> User Roles -> Group Direct -> Group Roles
  const combinedPermissions: Permissions = { ...user.permissions };

  user.roles.forEach((roleName) => {
    mergePermissions(combinedPermissions, roles.get(roleName));
  });

  user.groups.forEach((groupName) => {
    const group = groups.get(groupName);
    if (!group) return;

    mergePermissions(combinedPermissions, group.permissions);

    group.roles.forEach((roleName) => {
      mergePermissions(combinedPermissions, roles.get(roleName));
    });
  });

  return combinedPermissions;
}

function mergePermissions(target: Permissions, source?: Permissions): void {
  if (!source) return;

  Object.entries(source).forEach(([key, value]) => {
    if (target[key] === undefined) {
      target[key] = value;
    }
  });
}

// --- Fonction checkPerms MODIFIÉE ---

/**
 * Vérifie si un utilisateur satisfait aux exigences spécifiées.
 * La fonction retourne `true` si l'utilisateur remplit AU MOINS UNE des conditions
 * définies dans l'objet `requirements`.
 * - Pour `permissions`: l'utilisateur doit avoir TOUTES les permissions listées avec la valeur `true`.
 * - Pour `roles`: l'utilisateur doit avoir AU MOINS UN des rôles listés directement.
 * - Pour `groups`: l'utilisateur doit appartenir AU MOINS A UN des groupes listés directement.
 *
 * @param userId L'ID de l'utilisateur à vérifier.
 * @param requirements Un objet contenant les permissions, rôles et/ou groupes requis.
 * @returns `true` si au moins une condition est remplie, `false` sinon.
 */
export function checkPerms(
  userId: string,
  requirements: CheckOptions,
): boolean {
  const user = users.get(userId) ?? createDefaultUser(userId);

  const normalizeToArray = (input?: string | string[]): string[] => {
    if (!input) return [];
    return Array.isArray(input) ? input : [input];
  };

  const requiredPerms = normalizeToArray(requirements.permissions);
  if (requiredPerms.length > 0) {
    const userPermissions = getUserPermissions(userId); // Réutilise la logique existante
    const hasAllPermissions = requiredPerms.every(
      (permission) => userPermissions[permission] === true,
    );
    if (hasAllPermissions) {
      logger.debug(
        `User "${userId}" check PASSED via permissions: [${
          requiredPerms.join(", ")
        }]`,
      );
      return true;
    }
  }

  const requiredRoles = normalizeToArray(requirements.roles);
  if (requiredRoles.length > 0) {
    const hasAnyRole = requiredRoles.some((role) => user.roles.includes(role));
    if (hasAnyRole) {
      logger.debug(
        `User "${userId}" check PASSED via roles: [${
          requiredRoles.join(", ")
        }] (match found)`,
      );
      return true;
    }
  }

  const requiredGroups = normalizeToArray(requirements.groups);
  if (requiredGroups.length > 0) {
    const hasAnyGroup = requiredGroups.some((group) =>
      user.groups.includes(group)
    );
    if (hasAnyGroup) {
      logger.debug(
        `User "${userId}" check PASSED via groups: [${
          requiredGroups.join(", ")
        }] (match found)`,
      );
      return true;
    }
  }

  logger.debug(
    `User "${userId}" check FAILED for requirements: ${
      JSON.stringify(requirements)
    }`,
  );
  return false;
}
