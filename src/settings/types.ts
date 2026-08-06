import { LogLevel } from "../logger";

export const DATA_VERSION = 2;

export interface GithubAccount {
	id: string;
	name: string;
	orgs: string[];
	/** Runtime-only: populated from secretStorage on load. Not persisted. */
	token: string;
	/** Name of the secret in Obsidian's SecretStorage. Persisted in data.json. */
	tokenSecret: string;
	customOAuth?: boolean;
	clientId?: string;
}

export interface GithubLinkPluginData {
	settings: GithubLinkPluginSettings;
	cache: string[] | null;
	dataVersion: number;
}

export interface GithubLinkPluginSettings {
	accounts: GithubAccount[];
	defaultAccount?: string;
	defaultPageSize: number;
	showPagination: boolean;
	showRefresh: boolean;
	showExternalLink: boolean;
	logLevel: LogLevel;
	tagTooltips: boolean;
	tagShowPRMergeable: boolean;
	tagShowFileBranchName: boolean;
	tagShowFileLineNumber: boolean;
	cacheIntervalSeconds: number;
	maxCacheAgeHours: number;
	minRequestSeconds: number;
}

export const DEFAULT_SETTINGS: GithubLinkPluginSettings = {
	accounts: [],
	defaultPageSize: 10,
	showPagination: true,
	showRefresh: true,
	showExternalLink: true,
	logLevel: LogLevel.Error,
	tagTooltips: false,
	tagShowPRMergeable: false,
	tagShowFileBranchName: true,
	tagShowFileLineNumber: true,
	cacheIntervalSeconds: 60,
	maxCacheAgeHours: 120,
	minRequestSeconds: 60,
};
