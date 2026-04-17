import type { SecretStorage } from "obsidian";
import type { GithubAccount } from "./settings/types";
import { logger } from "./plugin";

const KEY_PREFIX = "gh-link-";

let storage: SecretStorage;

function keyFor(accountId: string): string {
	return `${KEY_PREFIX}${accountId}`;
}

export function initKeychain(secretStorage: SecretStorage): void {
	storage = secretStorage;
}

export function getToken(account: GithubAccount): string | null {
	return storage.getSecret(keyFor(account.id));
}

export function setToken(account: GithubAccount, token: string): void {
	storage.setSecret(keyFor(account.id), token);
}

export function clearToken(account: GithubAccount): void {
	storage.setSecret(keyFor(account.id), "");
}

/**
 * Migrate plain-text tokens from data.json into the keychain.
 */
export function migrateTokens(accounts: GithubAccount[]): void {
	for (const account of accounts) {
		if (account.token) {
			setToken(account, account.token);
			logger.info(`Migrated token for account "${account.name}" to Obsidian Keychain.`);
		}
	}
}

/**
 * Populate in-memory account tokens from the keychain.
 */
export function loadTokens(accounts: GithubAccount[]): void {
	for (const account of accounts) {
		const token = getToken(account);
		if (token) {
			account.token = token;
		}
	}
}
