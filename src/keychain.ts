import type { SecretStorage } from "obsidian";
import type { GithubAccount } from "./settings/types";
import { logger } from "./plugin";

let storage: SecretStorage;

export function initKeychain(secretStorage: SecretStorage): void {
	storage = secretStorage;
}

/**
 * Read the token value from SecretStorage using the account's secret name.
 */
export function getToken(account: GithubAccount): string | null {
	if (!account.tokenSecret) {
		return null;
	}
	return storage.getSecret(account.tokenSecret);
}

/**
 * Store a token under a named secret and update the account's tokenSecret reference.
 */
export function setToken(account: GithubAccount, token: string, secretName?: string): void {
	if (!secretName && !account.tokenSecret) {
		secretName = `github-link-${account.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
	}
	if (secretName) {
		account.tokenSecret = secretName;
	}
	storage.setSecret(account.tokenSecret, token);
}

/**
 * Clear the token value from SecretStorage (the entry remains with an empty value).
 */
export function clearToken(account: GithubAccount): void {
	if (account.tokenSecret) {
		storage.setSecret(account.tokenSecret, "");
	}
}

/**
 * Migrate plain-text tokens from data.json into named secrets.
 * Called once on data version upgrade.
 */
export function migrateTokens(accounts: GithubAccount[]): void {
	for (const account of accounts) {
		if (account.token && !account.tokenSecret) {
			setToken(account, account.token);
			logger.info(`Migrated token for account "${account.name}" to Obsidian Keychain as "${account.tokenSecret}".`);
		}
	}
}

/**
 * Populate in-memory account tokens from SecretStorage on startup.
 */
export function loadTokens(accounts: GithubAccount[]): void {
	for (const account of accounts) {
		const token = getToken(account);
		if (token) {
			account.token = token;
		}
	}
}
