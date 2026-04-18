import { LogLevel } from "../logger";

export const DATA_VERSION = 1;

export interface GithubAccount {
	id: string;
	name: string;
	orgs: string[];
	token: string;
	customOAuth?: boolean;
	clientId?: string;
}

export interface GithubLinkPluginData {
	settings: GithubLinkPluginSettings;
	/** @deprecated Cache is now stored in IndexedDB. Only used during migration. */
	cache?: string[] | null;
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
	maxCacheAgeHours: 120,
	minRequestSeconds: 60,
};
